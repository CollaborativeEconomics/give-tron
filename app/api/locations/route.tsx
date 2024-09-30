import { getLocations } from '@/libs/utils/registry'

export async function GET(request: Request) {
  const data = await getLocations() || []
  console.log('Locations', data?.length)
  return Response.json(data)
}
