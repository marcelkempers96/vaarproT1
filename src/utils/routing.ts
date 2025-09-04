// Routing utilities for VaarApp - EXACTLY matching the working HTML version

// Earth's radius in meters
const R = 6371000
const toRad = (d: number) => d * Math.PI / 180

// Calculate geographic distance between two points in meters - EXACTLY like HTML version
export const haversine = (a: [number, number], b: [number, number]) => {
  const [lat1, lon1] = a, [lat2, lon2] = b
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1)
  const s = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2
  return 2 * R * Math.asin(Math.sqrt(s))
}

// Find nearest point on line segment - EXACTLY like HTML version
export const nearestPointOnSegment = (p: [number, number], a: [number, number], b: [number, number]): [number, number, number] => {
  const toXY = ([lat, lon]: [number, number]) => [lon, lat]
  const A = toXY(a), B = toXY(b), P = toXY(p)
  const AB = [B[0]-A[0], B[1]-A[1]], AP = [P[0]-A[0], P[1]-A[1]]
  const ab2 = AB[0]*AB[0] + AB[1]*AB[1]
  const t = ab2 ? Math.max(0, Math.min(1, (AP[0]*AB[0]+AP[1]*AB[1]) / ab2)) : 0
  const Q = [A[0]+t*AB[0], A[1]+t*AB[1]]
  return [Q[1], Q[0], t] // Return [lat, lon, t]
}

// Graph structure - EXACTLY matching the working HTML version
export interface Graph {
  nextId: number
  nodes: Map<string, number>
  coords: Map<number, [number, number]>
  adj: Map<number, [number, number][]> // [idB, distance] pairs exactly like HTML
  segments: Array<{a: [number, number], b: [number, number], idA: number, idB: number}>
}

// Add node to graph - EXACTLY like HTML version
export const graphAddNode = (lat: number, lon: number, graph: Graph) => {
  const key = `${lat.toFixed(6)},${lon.toFixed(6)}`
  if (graph.nodes.has(key)) return graph.nodes.get(key)!
  
  const id = graph.nextId++
  graph.nodes.set(key, id)
  graph.coords.set(id, [lat, lon])
  graph.adj.set(id, [])
  return id
}

// Add edge to graph - EXACTLY like HTML version
export const graphAddEdge = (idA: number, idB: number, graph: Graph) => {
  const a = graph.coords.get(idA)!, b = graph.coords.get(idB)!
  const d = haversine(a, b)
  graph.adj.get(idA)!.push([idB, d])
  graph.adj.get(idB)!.push([idA, d])
  graph.segments.push({ a, b, idA, idB })
}

// Build graph from waterways data - EXACTLY like HTML version
export const buildGraphFromWaterways = (elements: any[]): Promise<Graph> => {
  console.log('🔍 Building graph from', elements.length, 'elements')
  
  const graph: Graph = {
    nextId: 1,
    nodes: new Map(),
    coords: new Map(),
    adj: new Map(),
    segments: []
  }

  // Build in small batches to keep UI smooth - EXACTLY like HTML version
  return new Promise((resolve) => {
    const BATCH = 200
    let i = 0
    
    function step() {
      const end = Math.min(elements.length, i + BATCH)
      
      for (; i < end; i++) {
        const el = elements[i]
        if (el.type === 'way' && el.geometry && el.geometry.length >= 2) {
          // Filter out non-navigable waterways (ditches, drains, streams)
          const waterwayType = el.tags?.waterway
          const navigableTypes = ['canal', 'river', 'fairway', 'shipyard', 'navigation']
          
          if (!waterwayType || !navigableTypes.includes(waterwayType)) {
            continue // Skip non-navigable waterways
          }
          
          // Additional filtering for rivers - only include major/navigable ones
          if (waterwayType === 'river') {
            const width = el.tags?.width ? parseFloat(el.tags.width) : null
            const boat = el.tags?.boat
            const motorboat = el.tags?.motorboat
            const ship = el.tags?.ship
            
            // Skip small rivers unless explicitly marked as boat-accessible
            if (width && width < 10 && !boat && !motorboat && !ship) {
              continue // Skip small rivers
            }
            
            // Skip rivers explicitly marked as not accessible to boats
            if (boat === 'no' || motorboat === 'no' || ship === 'no') {
              continue // Skip non-boat rivers
            }
          }
          
          // CRITICAL: Use [lon, lat] format like HTML version
          const coords = el.geometry.map((g: any) => [g.lon, g.lat])
          
          let prevId: number | null = null
          for (let j = 0; j < coords.length; j++) {
            // Extract lat from index 1, lon from index 0 (matching HTML version)
            const lat = coords[j][1], lon = coords[j][0]
            const id = graphAddNode(lat, lon, graph)
            if (prevId !== null) graphAddEdge(prevId, id, graph)
            prevId = id
          }
        }
      }
      
      if (i < elements.length) {
        // Process next batch asynchronously to keep UI responsive
        setTimeout(step, 0)
      } else {
        console.log(`🔍 Graph building complete: ${graph.nodes.size} nodes, ${graph.segments.length} segments`)
        resolve(graph)
      }
    }
    
    step()
  })
}

// Find nearest graph node - EXACTLY like HTML version
export const findNearestGraphNode = (latlng: {lat: number, lng: number}, graph: Graph, snap: boolean = true) => {
  let target: [number, number] = [latlng.lat, latlng.lng]
  let nearest = { 
    dist: Infinity, 
    id: null as number | null, 
    proj: target as [number, number], 
    idA: null as number | null, 
    idB: null as number | null,
    t: 0
  }
  
  if (snap && graph.segments.length > 0) {
    // Scan segments (could be further optimized with spatial index) - EXACTLY like HTML
    for (const seg of graph.segments) {
      const proj = nearestPointOnSegment(target, seg.a, seg.b)
      const d = haversine(target, [proj[0], proj[1]])
      if (d < nearest.dist) {
        nearest = { 
          dist: d, 
          idA: seg.idA, 
          idB: seg.idB, 
          t: proj[2], 
          proj: [proj[0], proj[1]] as [number, number],
          id: null
        }
      }
    }
    
    if (nearest.idA !== null && nearest.idB !== null) {
      const tempId = graphAddNode(nearest.proj[0], nearest.proj[1], graph)
      graph.adj.get(tempId)!.length = 0
      
      const dA = haversine(nearest.proj, graph.coords.get(nearest.idA)!)
      const dB = haversine(nearest.proj, graph.coords.get(nearest.idB)!)
      
      graph.adj.get(tempId)!.push([nearest.idA, dA])
      graph.adj.get(nearest.idA)!.push([tempId, dA])
      graph.adj.get(tempId)!.push([nearest.idB, dB])
      graph.adj.get(nearest.idB)!.push([tempId, dB])
      
      return { id: tempId, snapped: true, at: nearest.proj }
    }
  } else {
    for (const [id, coord] of graph.coords) {
      const d = haversine(target, coord)
      if (d < nearest.dist) {
        nearest = { 
          dist: d, 
          id, 
          proj: coord, 
          idA: null, 
          idB: null,
          t: 0
        }
      }
    }
    if (nearest.id !== null) {
      return { id: nearest.id, snapped: false, at: nearest.proj }
    }
  }
  
  return null
}

// Build graph arrays for routing - EXACTLY like HTML version
export const buildGraphArrays = (graph: Graph) => {
  const maxId = graph.nextId - 1
  const coords = new Array(maxId + 1) // 1..maxId
  for (const [id, c] of graph.coords) coords[id] = c
  
  const adj = new Array(maxId + 1)
  for (const [id, list] of graph.adj) {
    const flat = new Float64Array(list.length * 2)
    for (let i = 0; i < list.length; i++) {
      flat[i*2] = list[i][0]
      flat[i*2+1] = list[i][1]
    }
    adj[id] = Array.from(flat) // structured clone friendly
  }
  
  return { coords, adj }
}

// Dijkstra's algorithm - EXACTLY like HTML version (without Web Worker for now)
export const findShortestPath = (startId: number, endId: number, graph: Graph) => {
  console.log(`🔍 Starting Dijkstra with ${graph.nextId - 1} nodes, start: ${startId}, end: ${endId}`)
  
  const { coords, adj } = buildGraphArrays(graph)
  const N = coords.length - 1 // ids are 1..N
  
  const dist = new Array(N + 1).fill(Infinity)
  const prev = new Array(N + 1).fill(0)
  const visited = new Array(N + 1).fill(false)
  
  dist[startId] = 0
  
  // Simple Dijkstra implementation (HTML version uses Web Worker with min-heap)
  for (let i = 0; i <= N; i++) {
    // Find unvisited node with minimum distance
    let u = -1
    let minDist = Infinity
    
    for (let j = 0; j <= N; j++) {
      if (!visited[j] && dist[j] < minDist) {
        minDist = dist[j]
        u = j
      }
    }
    
    if (u === -1 || u === endId) break
    
    visited[u] = true
    
    // Update distances to neighbors - EXACTLY like HTML version
    const row = adj[u] || []
    for (let k = 0; k < row.length; k += 2) {
      const v = row[k], w = row[k + 1]
      if (v !== undefined && w !== undefined) {
        const nd = dist[u] + w
        if (nd < dist[v]) {
          dist[v] = nd
          prev[v] = u
        }
      }
    }
  }
  
  if (!prev[endId]) {
    console.log(`❌ No path found to end node ${endId}`)
    return null
  }
  
  // Reconstruct path - EXACTLY like HTML version
  const path: number[] = []
  for (let u = endId; u !== 0; u = prev[u]) {
    path.push(u)
    if (u === startId) break
  }
  path.reverse()
  
  console.log(`✅ Path found: ${path.length} nodes, total distance: ${Math.round(dist[endId])}m`)
  return { path, meters: dist[endId] }
}

// Corridor-based waterway prefetching - EXACTLY like kanaalkaart
export const prefetchWaterwaysForCorridor = async (
  startLL: {lat: number, lng: number}, 
  endLL: {lat: number, lng: number}, 
  fetchOverpass: (query: string, key: string) => Promise<any>,
  pad: number = 0.12 // ~13 km default padding
): Promise<any> => {
  console.log('🔄 Prefetching waterways for corridor from', startLL, 'to', endLL)
  
  // Calculate corridor bounds with padding
  let s = Math.min(startLL.lat, endLL.lat) - pad
  let w = Math.min(startLL.lng, endLL.lng) - pad
  let n = Math.max(startLL.lat, endLL.lat) + pad
  let e = Math.max(startLL.lng, endLL.lng) + pad
  
  // Clamp to valid bounds
  s = Math.max(-90, s)
  n = Math.min(90, n)
  w = Math.max(-180, w)
  e = Math.min(180, e)
  
  console.log('📐 Corridor bounds:', { s, w, n, e })
  
  // Create waterways query for the corridor
  const bbox = `${s},${w},${n},${e}`
  const query = `[
    out:json][timeout:30];
    way["waterway"~"^(canal|river|stream|drain|ditch)$"](${bbox});
    out tags geom;`
  
  try {
    const key = `corr:${[s, w, n, e].map(v => v.toFixed(3)).join(',')}`
    const data = await fetchOverpass(query, `w:${key}`)
    console.log('✅ Corridor waterways fetched:', data.elements?.length || 0, 'elements')
    return data
  } catch (err) {
    console.log('⚠️ Large corridor failed, trying smaller tiles...')
    
    // Fallback: split into smaller tiles if the bbox is too large for Overpass
    const step = 0.25 // ~28 km tiles
    const tasks = []
    const allElements: any[] = []
    
    for (let lat = s; lat < n; lat = Math.min(n, lat + step)) {
      for (let lon = w; lon < e; lon = Math.min(e, lon + step)) {
        const s2 = lat, w2 = lon, n2 = Math.min(n, lat + step), e2 = Math.min(e, lon + step)
        const bbox2 = `${s2},${w2},${n2},${e2}`
        const query2 = `[
          out:json][timeout:30];
          way["waterway"~"^(canal|river|stream|drain|ditch)$"](${bbox2});
          out tags geom;`
        
        tasks.push((async () => {
          try {
            const key2 = `corr:${[s2, w2, n2, e2].map(v => v.toFixed(3)).join(',')}`
            const data2 = await fetchOverpass(query2, `w:${key2}`)
            if (data2.elements) {
              allElements.push(...data2.elements)
            }
          } catch (e) {
            console.warn('Failed to fetch tile:', e)
          }
        })())
      }
    }
    
    await Promise.allSettled(tasks)
    console.log('✅ Corridor waterways fetched via tiles:', allElements.length, 'elements')
    return { elements: allElements }
  }
}

// Main routing function with immediate corridor prefetching
export const findWaterwayRoute = async (
  start: [number, number], 
  end: [number, number], 
  waterwaysData: any, 
  boatSpeed: number = 8.5,
  fetchOverpass?: (query: string, key: string) => Promise<any>
) => {
  console.log('🛣️ Finding waterway route from', start, 'to', end)
  
  let dataToUse = waterwaysData
  
  // If we have a fetchOverpass function and no waterways data, or insufficient data, prefetch for corridor
  if (fetchOverpass && (!waterwaysData || !waterwaysData.elements || waterwaysData.elements.length === 0)) {
    console.log('🔄 No waterways data available, prefetching for corridor...')
    dataToUse = await prefetchWaterwaysForCorridor(
      {lat: start[0], lng: start[1]}, 
      {lat: end[0], lng: end[1]}, 
      fetchOverpass
    )
  }
  
  if (!dataToUse || !dataToUse.elements) {
    console.log('❌ No waterways data available - cannot create route')
    return null
  }

  // Build graph from waterways data
  const graph = await buildGraphFromWaterways(dataToUse.elements)
  
  if (graph.segments.length === 0) {
    console.log('❌ No graph segments available - cannot create route')
    return null
  }

  // Find nearest graph nodes for start and end points
  const startNode = findNearestGraphNode({lat: start[0], lng: start[1]}, graph, true)
  const endNode = findNearestGraphNode({lat: end[0], lng: end[1]}, graph, true)

  if (!startNode || !endNode) {
    console.log('❌ Could not find nearest graph nodes')
    return null
  }

  console.log('📍 Start node:', startNode.id, 'at', startNode.at)
  console.log('📍 End node:', endNode.id, 'at', endNode.at)

  // Find shortest path using Dijkstra's algorithm
  const route = findShortestPath(startNode.id, endNode.id, graph)
  
  if (!route) {
    console.log('❌ No path found between start and end nodes')
    return null
  }

  // Convert node IDs to coordinates - this will now follow waterways!
  const coordinates: [number, number][] = route.path.map(id => {
    const coord = graph.coords.get(id)!
    return [coord[0], coord[1]] // [lat, lng]
  })

  console.log('✅ Route coordinates:', coordinates.length, 'points')
  console.log('✅ First coordinate:', coordinates[0])
  console.log('✅ Last coordinate:', coordinates[coordinates.length - 1])

  // Convert boat speed from km/h to m/s for calculation
  const speedMps = (boatSpeed * 1000) / 3600
  
  const routeResult = {
    coordinates,
    steps: [{
      waterway: 'Waterway Network',
      instruction: 'Follow waterways to destination',
      distance: Math.round(route.meters),
      estimatedTime: Math.round(route.meters / speedMps / 60) // Convert to minutes
    }],
    totalDistance: route.meters,
    totalTime: Math.round(route.meters / speedMps / 60) // Convert to minutes
  }

  return routeResult
}
