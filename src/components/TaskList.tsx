
'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { Task, UserProfile } from '@/lib/types';
import { collection, query, orderBy, Query, doc, addDoc, updateDoc, serverTimestamp, writeBatch, documentId, getDocs, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PlusCircle, Trash2, ChevronUp, ChevronsUp, ChevronDown } from 'lucide-react';
import { useToast } from './ui/use-toast';

interface TaskListProps {
  groupOrCohortId: string;
  collectionPath: 'studyGroups' | 'cohorts';
  memberIds: string[];
}

const priorityIcons = {
  high: <ChevronsUp className="h-5 w-5 text-red-500" />,
  medium: <ChevronUp className="h-5 w-5 text-yellow-500" />,
  low: <ChevronDown className="h-5 w-5 text-green-500" />,
};

const priorityOrder = { high: 1, medium: 2, low: 3 };

function UserAvatar({ userId, userProfiles }: { userId: string | undefined | null; userProfiles: Map<string, UserProfile> }) {
  if (!userId) return null;
  const user = userProfiles.get(userId);
  const fallback = user?.username ? user.username.charAt(0).toUpperCase() : '?';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Avatar className="h-6 w-6">
            <AvatarImage src={user?.profilePictureUrl} alt={user?.username} />
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent>
          <p>{user?.username || 'Unknown User'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function TaskList({ groupOrCohortId, collectionPath, memberIds }: TaskListProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map());

  const tasksCollectionRef = useMemo(() => 
    collection(firestore, collectionPath, groupOrCohortId, 'tasks'),
    [firestore, collectionPath, groupOrCohortId]
  );
  
  const tasksQuery = useMemo(() => 
    query(tasksCollectionRef, orderBy('createdAt', 'desc')),
    [tasksCollectionRef]
  );
  
  const { data: tasks, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);
  
  const isMember = user ? memberIds.includes(user.uid) : false;

  useMemo(() => {
    const fetchProfiles = async () => {
        if (!tasks) return;
        const userIdsToFetch = new Set<string>();
        tasks.forEach(task => {
            if (task.creatorId) userIdsToFetch.add(task.creatorId);
            if (task.completedBy) userIdsToFetch.add(task.completedBy);
        });

        if (userIdsToFetch.size > 0) {
            const profilesToFetch = Array.from(userIdsToFetch).filter(id => !userProfiles.has(id));
            if (profilesToFetch.length === 0) return;

            const newProfiles = new Map(userProfiles);
            const profilesQuery = query(collection(firestore, 'users'), where(documentId(), 'in', profilesToFetch.slice(0, 30)));
            const snapshot = await getDocs(profilesQuery);
            snapshot.forEach(doc => {
                newProfiles.set(doc.id, {id: doc.id, ...doc.data()} as UserProfile);
            });
            setUserProfiles(newProfiles);
        }
    };
    fetchProfiles();
  }, [tasks, firestore, userProfiles]);

  const handleAddTask = async () => {
    if (!user || !isMember || !newTask.trim()) return;

    try {
      await addDoc(tasksCollectionRef, {
        description: newTask,
        priority: newPriority,
        isCompleted: false,
        creatorId: user.uid,
        completedBy: null,
        createdAt: serverTimestamp(),
        completedAt: null,
      });
      setNewTask('');
      setNewPriority('medium');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to add task', description: error.message });
    }
  };

  const handleToggleTask = async (task: Task) => {
    if (!user || !isMember) return;
    const taskRef = doc(firestore, collectionPath, groupOrCohortId, 'tasks', task.id);
    try {
      await updateDoc(taskRef, {
        isCompleted: !task.isCompleted,
        completedBy: task.isCompleted ? null : user.uid,
        completedAt: task.isCompleted ? null : serverTimestamp(),
      });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to update task', description: error.message });
    }
  };
  
  const handleDeleteTask = async (taskId: string) => {
      if (!user || !isMember) return;
      try {
          const taskRef = doc(firestore, collectionPath, groupOrCohortId, 'tasks', taskId);
          const batch = writeBatch(firestore);
          batch.delete(taskRef);
          await batch.commit();
      } catch (error: any) {
           toast({ variant: 'destructive', title: 'Failed to delete task', description: error.message });
      }
  };


  const sortedTasks = useMemo(() => {
    return tasks?.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }) || [];
  }, [tasks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task List</CardTitle>
      </CardHeader>
      <CardContent>
        {isMember && (
          <div className="flex items-center gap-2 mb-4">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a new task..."
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            />
             <Select value={newPriority} onValueChange={(v: 'low'|'medium'|'high') => setNewPriority(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddTask}>
              <PlusCircle className="h-4 w-4 mr-2" /> Add
            </Button>
          </div>
        )}

        <div className="space-y-2">
            {tasksLoading && <p>Loading tasks...</p>}
            {!tasksLoading && sortedTasks.length === 0 && <p className="text-muted-foreground text-center py-4">No tasks yet.</p>}
            {sortedTasks.map(task => (
                <div key={task.id} className="flex items-center gap-4 p-2 border rounded-md hover:bg-accent/50">
                    {isMember ? (
                        <Checkbox id={task.id} checked={task.isCompleted} onCheckedChange={() => handleToggleTask(task)} />
                    ) : (
                        <Checkbox id={task.id} checked={task.isCompleted} disabled />
                    )}
                    <div className="flex-1">
                        <label htmlFor={task.id} className={`flex-1 text-sm ${task.isCompleted ? 'text-muted-foreground line-through' : ''}`}>
                            {task.description}
                        </label>
                    </div>
                    <div className="flex items-center gap-4">
                        {priorityIcons[task.priority]}
                        <UserAvatar userId={task.creatorId} userProfiles={userProfiles} />
                        {task.isCompleted && <UserAvatar userId={task.completedBy} userProfiles={userProfiles} />}
                        {isMember && user?.uid === task.creatorId && !task.isCompleted && (
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        )}
                    </div>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
