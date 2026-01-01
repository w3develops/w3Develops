
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { Task, UserProfile } from '@/lib/types';
import { collection, query, orderBy, addDoc, updateDoc, serverTimestamp, writeBatch, documentId, getDocs, where, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { PlusCircle, Trash2, GripVertical } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface TaskListProps {
  groupOrCohortId: string;
  collectionPath: 'studyGroups' | 'cohorts';
  memberIds: string[];
}

const priorityColors = {
  high: 'text-red-500',
  medium: 'text-yellow-600',
  low: 'text-green-500',
};

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

function SortableTaskItem({ task, userProfiles, isMember, onToggle, onDelete, user }: { task: Task, userProfiles: Map<string, UserProfile>, isMember: boolean, onToggle: (task: Task) => void, onDelete: (taskId: string) => void, user: any }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 border rounded-md bg-background">
            {isMember && (
                <button {...attributes} {...listeners} className="cursor-grab p-1">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                </button>
            )}
            <Checkbox id={task.id} checked={task.isCompleted} onCheckedChange={() => onToggle(task)} disabled={!isMember}/>
            <div className="flex-1">
                <label htmlFor={task.id} className={cn('flex-1 text-sm', task.isCompleted && 'text-muted-foreground line-through')}>
                    {task.description}
                </label>
            </div>
            <div className="flex items-center gap-4">
                <span className={cn("font-semibold text-sm", priorityColors[task.priority])}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
                <UserAvatar userId={task.creatorId} userProfiles={userProfiles} />
                {task.isCompleted && <UserAvatar userId={task.completedBy} userProfiles={userProfiles} />}
                {isMember && user?.uid === task.creatorId && !task.isCompleted && (
                    <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                )}
            </div>
        </div>
    );
}

export default function TaskList({ groupOrCohortId, collectionPath, memberIds }: TaskListProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | ''>('');
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);

  const tasksCollectionRef = useMemo(() => 
    collection(firestore, collectionPath, groupOrCohortId, 'tasks'),
    [firestore, collectionPath, groupOrCohortId]
  );
  
  const tasksQuery = useMemo(() => 
    query(tasksCollectionRef, orderBy('position')),
    [tasksCollectionRef]
  );
  
  const { data: tasks, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);
  
  useEffect(() => {
    if (tasks) {
        setActiveTasks(tasks);
    }
  }, [tasks]);
  
  const isMember = user ? memberIds.includes(user.uid) : false;

  useEffect(() => {
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
            // Firestore 'in' queries are limited to 30 elements.
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
    if (!user || !isMember || !newTask.trim() || !newPriority) return;

    try {
      const highestPosition = tasks && tasks.length > 0 ? Math.max(...tasks.map(t => t.position)) : 0;
      await addDoc(tasksCollectionRef, {
        description: newTask,
        priority: newPriority,
        isCompleted: false,
        creatorId: user.uid,
        completedBy: null,
        createdAt: serverTimestamp(),
        completedAt: null,
        position: highestPosition + 1,
      });
      setNewTask('');
      setNewPriority('');
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
          const taskRef = doc(tasksCollectionRef, taskId);
          await updateDoc(taskRef, { position: -1 }); // Optimistically remove
          await writeBatch(firestore).delete(taskRef).commit();
      } catch (error: any) {
           toast({ variant: 'destructive', title: 'Failed to delete task', description: error.message });
      }
  };

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;

    if (over && active.id !== over.id) {
        setActiveTasks((items) => {
            const oldIndex = items.findIndex(item => item.id === active.id);
            const newIndex = items.findIndex(item => item.id === over.id);
            const newOrder = arrayMove(items, oldIndex, newIndex);
            
            // Update positions in Firestore
            const batch = writeBatch(firestore);
            newOrder.forEach((task, index) => {
                const taskRef = doc(tasksCollectionRef, task.id);
                batch.update(taskRef, { position: index });
            });
            batch.commit().catch(err => {
                toast({ variant: 'destructive', title: 'Failed to reorder tasks', description: err.message });
                // Revert optimistic update on failure
                setActiveTasks(items);
            });

            return newOrder;
        });
    }
  }

  const isAddButtonDisabled = !newTask.trim() || !newPriority;

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
              onKeyDown={(e) => e.key === 'Enter' && !isAddButtonDisabled && handleAddTask()}
            />
             <Select value={newPriority} onValueChange={(v: 'low'|'medium'|'high' | '') => setNewPriority(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddTask} disabled={isAddButtonDisabled}>
              <PlusCircle className="h-4 w-4 mr-2" /> Add
            </Button>
          </div>
        )}

        <div className="space-y-2">
            {tasksLoading && <p>Loading tasks...</p>}
            {!tasksLoading && activeTasks.length === 0 && <p className="text-muted-foreground text-center py-4">No tasks yet.</p>}
            
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={activeTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {activeTasks.filter(t => t.position !== -1).map(task => (
                        <SortableTaskItem key={task.id} task={task} userProfiles={userProfiles} isMember={isMember} onToggle={handleToggleTask} onDelete={handleDeleteTask} user={user} />
                    ))}
                </SortableContext>
            </DndContext>
        </div>
      </CardContent>
    </Card>
  );
}

    