// Algorithms Daily (/algorithms-daily): one classic problem a day, the same
// for everyone, picked by the UTC date from the list below. The list repeats
// once it runs out. Problems are written in our own words; each has hints
// rather than a full solution, so people can discuss answers on the feed.

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface DailyProblem {
  slug: string;
  title: string;
  difficulty: Difficulty;
  topics: string[];
  statement: string;
  example: string;
  hints: string[];
}

export const PROBLEMS: DailyProblem[] = [
  { slug: 'pair-sum', title: 'Pair that adds up', difficulty: 'Easy', topics: ['arrays', 'hash maps'],
    statement: 'Given a list of numbers and a target, return the positions of two different numbers that add up to the target. Assume exactly one answer exists.',
    example: 'numbers = [3, 8, 11, 5], target = 13 → [1, 3] (8 + 5)',
    hints: ['Checking every pair works but takes O(n²) time.', 'As you walk the list, remember each number you have seen and where.', 'For each number, ask: have I already seen target − number?'] },
  { slug: 'balanced-brackets', title: 'Balanced brackets', difficulty: 'Easy', topics: ['stacks', 'strings'],
    statement: 'Given a string of the characters ( ) [ ] { }, decide whether every opening bracket is closed by the same type, in the right order.',
    example: '"{[()]}" → true, "([)]" → false',
    hints: ['The most recent unclosed bracket must be closed first.', 'A stack holds the brackets still waiting to be closed.', 'At the end, the stack must be empty.'] },
  { slug: 'reverse-words', title: 'Reverse the words', difficulty: 'Easy', topics: ['strings'],
    statement: 'Reverse the order of words in a sentence. Words are separated by one or more spaces; the result should have single spaces and no spaces at the ends.',
    example: '"  learn   to code " → "code to learn"',
    hints: ['Split on runs of spaces and drop empty pieces.', 'Can you do it in place on a character array? Reverse the whole thing, then each word.'] },
  { slug: 'missing-number', title: 'The missing number', difficulty: 'Easy', topics: ['math', 'bit manipulation'],
    statement: 'A list holds n different numbers from 0 to n, so exactly one is missing. Find it using O(1) extra space.',
    example: '[4, 0, 1, 3] → 2',
    hints: ['What should the numbers 0..n add up to?', 'XOR has a neat property: x ^ x = 0.'] },
  { slug: 'palindrome-check', title: 'Palindrome, ignoring the noise', difficulty: 'Easy', topics: ['two pointers', 'strings'],
    statement: 'Decide whether a string reads the same forwards and backwards, considering only letters and digits and ignoring case.',
    example: '"Never odd or even" → true',
    hints: ['Use one pointer at each end and move them toward each other.', 'Skip characters that are not letters or digits.'] },
  { slug: 'merge-sorted', title: 'Merge two sorted lists', difficulty: 'Easy', topics: ['linked lists', 'two pointers'],
    statement: 'Merge two sorted linked lists into one sorted list by relinking the nodes, not copying them.',
    example: '1→4→6 and 2→3→7 → 1→2→3→4→6→7',
    hints: ['Compare the heads and take the smaller one each time.', 'A dummy start node removes the special case for the first node.'] },
  { slug: 'max-subarray', title: 'Best stretch of days', difficulty: 'Medium', topics: ['dynamic programming', 'arrays'],
    statement: 'Given daily gains and losses, find the largest total of any run of consecutive days (at least one day).',
    example: '[-2, 3, -1, 4, -6, 2] → 6 (3 − 1 + 4)',
    hints: ['If the run so far is negative, it only drags down what comes next.', 'Track the best run ending today, and the best seen overall.'] },
  { slug: 'stock-once', title: 'Buy once, sell once', difficulty: 'Easy', topics: ['arrays', 'greedy'],
    statement: 'Given a list of prices by day, find the largest profit from buying on one day and selling on a later day. Return 0 if no profit is possible.',
    example: '[9, 4, 7, 3, 8, 6] → 5 (buy at 3, sell at 8)',
    hints: ['For each day, what is the cheapest price before it?', 'One pass is enough.'] },
  { slug: 'anagram-groups', title: 'Group the anagrams', difficulty: 'Medium', topics: ['hash maps', 'strings'],
    statement: 'Group a list of words so words made of the same letters are together.',
    example: '["listen", "stone", "silent", "notes", "enlist"] → [["listen", "silent", "enlist"], ["stone", "notes"]]',
    hints: ['Two words are anagrams if their sorted letters match.', 'Use the sorted letters (or a letter count) as a map key.'] },
  { slug: 'longest-unique', title: 'Longest run without repeats', difficulty: 'Medium', topics: ['sliding window', 'strings'],
    statement: 'Find the length of the longest stretch of a string with no repeated character.',
    example: '"abcabcbb" → 3 ("abc")',
    hints: ['Keep a window that never contains a repeat.', 'When a repeat enters, move the window start past its last position.'] },
  { slug: 'binary-search-rotated', title: 'Search a rotated list', difficulty: 'Medium', topics: ['binary search'],
    statement: 'A sorted list of distinct numbers was rotated at an unknown point. Find the position of a target in O(log n) time, or −1.',
    example: '[15, 18, 2, 5, 9, 12], target = 5 → 3',
    hints: ['At any midpoint, one half is still sorted.', 'Check whether the target lies inside the sorted half.'] },
  { slug: 'climb-stairs', title: 'Ways up the stairs', difficulty: 'Easy', topics: ['dynamic programming'],
    statement: 'You climb a staircase of n steps, taking 1 or 2 steps at a time. How many different ways can you reach the top?',
    example: 'n = 4 → 5',
    hints: ['The last move was either 1 step or 2 steps.', 'ways(n) = ways(n − 1) + ways(n − 2). Look familiar?'] },
  { slug: 'coin-change', title: 'Fewest coins', difficulty: 'Medium', topics: ['dynamic programming'],
    statement: 'Given coin values and an amount, return the fewest coins that make the amount exactly, or −1 if it cannot be made. You have unlimited coins of each value.',
    example: 'coins = [1, 5, 6, 9], amount = 11 → 2 (5 + 6)',
    hints: ['Always taking the biggest coin does not always work.', 'Build up the answer for every amount from 0 to the target.'] },
  { slug: 'islands', title: 'Count the islands', difficulty: 'Medium', topics: ['graphs', 'DFS/BFS'],
    statement: 'A grid has land (1) and water (0). Count the islands: groups of land cells connected up, down, left or right.',
    example: '[[1,1,0],[0,1,0],[1,0,1]] → 3',
    hints: ['When you find unvisited land, you have found a new island.', 'Flood-fill from it so you do not count its cells again.'] },
  { slug: 'course-order', title: 'Order the courses', difficulty: 'Medium', topics: ['graphs', 'topological sort'],
    statement: 'Courses have prerequisites given as pairs (a needs b first). Return an order to take all courses, or say it is impossible.',
    example: '4 courses, [[1,0],[2,0],[3,1],[3,2]] → [0, 1, 2, 3]',
    hints: ['A course with no remaining prerequisites can be taken now.', 'If you get stuck with courses left, there is a cycle.'] },
  { slug: 'lru-cache', title: 'Least-recently-used cache', difficulty: 'Medium', topics: ['design', 'hash maps', 'linked lists'],
    statement: 'Design a cache with a fixed capacity and get/put in O(1). When full, putting a new key removes the key used longest ago.',
    example: 'capacity 2: put(1), put(2), get(1), put(3) → key 2 is removed',
    hints: ['A hash map gives fast lookup; you also need fast reordering.', 'A doubly linked list keeps keys from most to least recently used.'] },
  { slug: 'kth-largest', title: 'K-th largest number', difficulty: 'Medium', topics: ['heaps', 'quickselect'],
    statement: 'Find the k-th largest number in an unsorted list without fully sorting it.',
    example: '[7, 2, 9, 4, 9, 1], k = 3 → 7',
    hints: ['A min-heap of size k keeps the k largest seen so far.', 'Quickselect finds it in O(n) on average.'] },
  { slug: 'merge-intervals', title: 'Merge overlapping meetings', difficulty: 'Medium', topics: ['sorting', 'intervals'],
    statement: 'Given meeting times as [start, end] pairs, merge any that overlap and return the result sorted by start.',
    example: '[[1,3],[8,10],[2,6],[9,12]] → [[1,6],[8,12]]',
    hints: ['Sort by start time first.', 'Compare each meeting with the last merged one.'] },
  { slug: 'level-order', title: 'Tree, level by level', difficulty: 'Medium', topics: ['trees', 'BFS'],
    statement: 'Return the values of a binary tree level by level, left to right.',
    example: 'root 3, children 9 and 20, 20 has 15 and 7 → [[3], [9, 20], [15, 7]]',
    hints: ['A queue visits nodes in the order you need.', 'Process the queue one level at a time by noting its size.'] },
  { slug: 'valid-bst', title: 'Is it a search tree?', difficulty: 'Medium', topics: ['trees', 'recursion'],
    statement: 'Decide whether a binary tree is a valid binary search tree: every left subtree holds smaller values and every right subtree larger ones.',
    example: 'root 5, left 3, right 7 with left child 4 → false (4 is on the right of 5)',
    hints: ['Checking only a node and its children is not enough.', 'Pass down the range of values each subtree is allowed.'] },
  { slug: 'word-ladder', title: 'Word ladder', difficulty: 'Hard', topics: ['graphs', 'BFS'],
    statement: 'Change one word into another one letter at a time, where every step must be a word in a given list. Return the fewest steps, or 0 if impossible.',
    example: 'cold → warm with [cord, card, ward, warm, word, worm] → 5',
    hints: ['Each word is a node; words one letter apart are connected.', 'Breadth-first search finds the shortest path.'] },
  { slug: 'trap-rain', title: 'Trapped rainwater', difficulty: 'Hard', topics: ['two pointers', 'arrays'],
    statement: 'Bars of given heights stand side by side. How much rainwater is trapped between them?',
    example: '[0,2,0,3,1,0,2] → 5',
    hints: ['Water above a bar depends on the tallest bar to its left and to its right.', 'Two pointers can do it in one pass with O(1) space.'] },
  { slug: 'edit-distance', title: 'Edit distance', difficulty: 'Hard', topics: ['dynamic programming', 'strings'],
    statement: 'Find the fewest single-character inserts, deletes or replacements that turn one word into another.',
    example: '"kitten" → "sitting" = 3',
    hints: ['Compare prefixes: the answer for longer prefixes builds on shorter ones.', 'A 2-D table of prefix lengths holds every subproblem.'] },
  { slug: 'median-stream', title: 'Running median', difficulty: 'Hard', topics: ['heaps', 'design'],
    statement: 'Numbers arrive one at a time. After each one, report the median of all numbers so far.',
    example: '5, 15, 1, 3 → 5, 10, 5, 4',
    hints: ['Keep the smaller half and the larger half separately.', 'A max-heap and a min-heap, kept balanced in size.'] },
  { slug: 'dijkstra', title: 'Cheapest route', difficulty: 'Medium', topics: ['graphs', 'shortest paths'],
    statement: 'Given roads between cities with travel costs (all positive), find the cheapest cost from one city to every other.',
    example: 'A→B 4, A→C 1, C→B 2 → cheapest to B is 3',
    hints: ['Always settle the closest unsettled city next.', 'A priority queue keeps that fast.'] },
  { slug: 'subsets', title: 'All the subsets', difficulty: 'Medium', topics: ['backtracking', 'bit manipulation'],
    statement: 'Return every subset of a list of distinct numbers.',
    example: '[1, 2, 3] → [], [1], [2], [3], [1,2], [1,3], [2,3], [1,2,3]',
    hints: ['Each number is either in or out: 2ⁿ subsets.', 'Backtrack, or count from 0 to 2ⁿ − 1 and read the bits.'] },
  { slug: 'n-queens', title: 'Queens that can’t attack', difficulty: 'Hard', topics: ['backtracking'],
    statement: 'Place n chess queens on an n×n board so no two share a row, column or diagonal. Count the ways.',
    example: 'n = 4 → 2',
    hints: ['Place one queen per row.', 'Track used columns and both diagonal directions in sets.'] },
  { slug: 'rate-limiter', title: 'Rate limiter', difficulty: 'Medium', topics: ['design', 'queues'],
    statement: 'Design allow(userId, time) that returns true only if the user made fewer than N requests in the last 60 seconds.',
    example: 'N = 3: requests at 0, 10, 20 allowed; at 30 refused; at 61 allowed',
    hints: ['Keep each user’s recent request times in a queue.', 'Drop times older than 60 seconds before deciding.'] },
  { slug: 'product-except-self', title: 'Product of everything else', difficulty: 'Medium', topics: ['arrays', 'prefix sums'],
    statement: 'For each position in a list, return the product of all the other numbers, without using division, in O(n).',
    example: '[1, 2, 3, 4] → [24, 12, 8, 6]',
    hints: ['The answer is (product of everything before) × (product of everything after).', 'Two passes: left to right, then right to left.'] },
  { slug: 'top-k-words', title: 'Most common words', difficulty: 'Medium', topics: ['hash maps', 'heaps'],
    statement: 'Return the k most frequent words in a list, most frequent first; break ties alphabetically.',
    example: '["go","js","go","py","js","go"], k = 2 → ["go", "js"]',
    hints: ['Count first, then pick the top k.', 'A heap of size k, or bucket sort by count.'] },
];

/** Days since 1 Jan 1970 (UTC) for a time in milliseconds */
export function utcDay(ms: number): number {
  return Math.floor(ms / 86_400_000);
}

/** The problem for a UTC day number */
export function problemForDay(day: number): DailyProblem {
  return PROBLEMS[((day % PROBLEMS.length) + PROBLEMS.length) % PROBLEMS.length];
}

/** "2026-11-11" for a UTC day number */
export function dayLabel(day: number): string {
  return new Date(day * 86_400_000).toISOString().slice(0, 10);
}
