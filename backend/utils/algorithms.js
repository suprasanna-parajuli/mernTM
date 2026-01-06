//1 Priority Score Calculation
//2 Weekly Time Allocation
//3 Gree

//ALGORITHM 1: PRIORITY SCORE CALCULATION

export function calculatePriorityScore(subject) {
  const now = new Date();//aajako date
  const startDate = new Date(subject.startDate);
  const examDate = new Date(subject.examDate);

  const totalDays = Math.floor((examDate - startDate) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.floor((examDate - now) / (1000 * 60 * 60 * 24));

  if (totalDays <= 0 || daysLeft < 0) return 0;

  const timeUrgency = 1 - (daysLeft / totalDays);
  const difficultyFactor = subject.difficulty / 5;

  return (timeUrgency * 0.5) + (difficultyFactor * 0.5);
}

// Algorithm 2: Allocate weekly time among subjects based on priority
export function allocateWeeklyTime(subjects, totalAvailableHours) {
  if (!subjects || subjects.length === 0) return [];

  const totalPriority = subjects.reduce((sum, s) => sum + (s.priorityScore || 0), 0);

  if (totalPriority === 0) return subjects;

  return subjects.map(subject => ({
    ...subject,
    allocatedTime: ((subject.priorityScore || 0) / totalPriority) * totalAvailableHours
  }));
}

// Algorithm 3: Greedy scheduler - fit subjects into free time blocks
export function generateSchedule(subjects, freeTimeBlocks) {
  const sorted = [...subjects].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
  const schedule = [];
  const blocks = JSON.parse(JSON.stringify(freeTimeBlocks));

  for (let i = 0; i < sorted.length; i++) {
    const subject = sorted[i];
    let remainingTime = subject.allocatedTime || 0;

    for (let j = 0; j < blocks.length; j++) {
      if (remainingTime <= 0) break;

      const block = blocks[j];

      // Calculate available time in this block
      const blockDuration = calculateBlockDuration(block.startTime, block.endTime);
      if (blockDuration <= 0) continue; // Skip if block is fully occupied

      const timeToSchedule = Math.min(remainingTime, blockDuration);

      schedule.push({
        subject: subject._id,
        subjectName: subject.name,
        day: block.day,
        startTime: block.startTime,
        endTime: addMinutesToTime(block.startTime, timeToSchedule * 60),
        duration: timeToSchedule * 60
      });

      remainingTime -= timeToSchedule;

      // Update the block: shrink it by moving start time forward
      block.startTime = addMinutesToTime(block.startTime, timeToSchedule * 60);

      // If block is fully used, remove it from consideration
      if (calculateBlockDuration(block.startTime, block.endTime) <= 0) {
        block.isOccupied = true;
      }
    }
  }

  return schedule;
}

// Helper: Calculate duration of a time block in hours
function calculateBlockDuration(startTime, endTime) {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return (endMinutes - startMinutes) / 60;
}

// Helper: Add minutes to a time string
function addMinutesToTime(timeStr, minutes) {
  const [hour, min] = timeStr.split(':').map(Number);
  const totalMinutes = hour * 60 + min + minutes;
  const newHour = Math.floor(totalMinutes / 60) % 24;
  const newMin = totalMinutes % 60;

  return `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`;
}

// Algorithm 4: Calculate progress percentage for a material
export function calculateProgress(material) {
  const validTags = ['study', 'revision', 'notes'];
  if (!validTags.includes(material.tag)) return 0;

  const targetMinutes = material.targetHours * 60;
  if (targetMinutes === 0) return 0;

  const percentage = (material.timeSpent / targetMinutes) * 100;

  if (percentage > 100) return 100;
  if (percentage < 0) return 0;

  return percentage;
}

// Algorithm 7: Check if schedule should regenerate
export function shouldRegenerate(eventType) {
  const triggers = [
    'study_session_completed',
    'subject_deadline_changed',
    'subject_added',
    'subject_removed',
    'week_changed',
    'availability_changed'
  ];

  return triggers.includes(eventType);
}
