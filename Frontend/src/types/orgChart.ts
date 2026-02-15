export type OrgArea = {
  id: string
  name: string
  positions: OrgPosition[]
}

export type OrgPosition = {
  id: string
  name: string
  areaId: string
  _count?: { userLinks: number }
}

export type UserPositionAssignment = {
  position: {
    id: string
    name: string
    area: { id: string; name: string }
  }
}

export type OrgChartUser = {
  id: string
  name: string
  email: string
  role?: 'LEADER' | 'EMPLOYEE'
}
