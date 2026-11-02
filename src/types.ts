export type Priority = 'low' | 'medium' | 'high'
export type Status = 'todo' | 'in-progress' | 'in-review' | 'completed'
export type Role = 'Admin' | 'Project Manager' | 'Member'
export type MemberStatus = 'Active' | 'Away' | 'Invited'

export type User = {
  id: string
  name: string
  email: string
  title: string
  bio: string
  avatar: string
}

export type Member = User & {
  role: Role
  status: MemberStatus
}

export type Project = {
  id: string
  name: string
  description: string
  deadline: string
  startDate: string
  ownerId: string
  memberIds: string[]
}

export type Subtask = { id: string; title: string; done: boolean }

export type Comment = {
  id: string
  authorId: string
  text: string
  createdAt: string
}

export type Activity = {
  id: string
  text: string
  createdAt: string
}

export type ProjectHealth = 'On Track' | 'At Risk' | 'Completed'

export type Attachment = { name: string; size: number }

export type Task = {
  id: string
  title: string
  description: string
  projectId: string
  assigneeId: string
  priority: Priority
  status: Status
  startDate: string
  dueDate: string
  labels: string[]
  subtasks: Subtask[]
  comments: Comment[]
  activity: Activity[]
  attachments: string[]
  completedAt?: string
}

export type NotificationItem = {
  id: string
  type: 'assignment' | 'deadline' | 'complete' | 'project' | 'invite' | 'comment'
  title: string
  body: string
  time: string
  createdAt?: string
  link?: string
  read: boolean
}

export type SettingsState = {
  workspace: string
  dateFormat: string
  emailNotifications: boolean
  taskAssignments: boolean
  deadlineReminders: boolean
  projectUpdates: boolean
  twoFactor: boolean
  theme: 'light' | 'dark'
  compact: boolean
}
