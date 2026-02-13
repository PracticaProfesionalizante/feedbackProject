export type AccessRole = {
  id: string
  name: string
  description?: string | null
  createdAt?: string
  updatedAt?: string
}

export type RoleFormValues = {
  name: string
  description?: string
}

export type UserListItem = {
  id: string
  name: string
  email: string
  role?: 'LEADER' | 'EMPLOYEE'
  roles?: AccessRole[]
}

export type UserRoleAssignmentsResponse = {
  user: {
    id: string
    name: string
    email: string
  }
  assignments: Array<{
    id?: string
    userId?: string
    roleId: string
    role?: AccessRole
  }>
}

export type SetUserRolesDto = {
  roleIds: string[]
}
