// d3
import { stack, stackOrderDescending } from 'd3-shape'
import { scaleLinear, scaleOrdinal } from 'd3-scale'
import { quadtree } from 'd3-quadtree'
import { stratify, pack, HierarchyCircularNode } from 'd3-hierarchy'
// util
import { getTotalEnergy } from '../utils'
// entity
import { Data } from '../types/entity'
export function createStack() {
    const keys = ['biofuels', 'coal', 'gas', 'biomass', 'hydro', 'nuclear', 'oil', 'solar', 'wind']
    return stack<Data>().keys(keys).order(stackOrderDescending)
}

export function createPackedData(data: Data[], width: number, height: number, padding = 20) {
    const stratified = stratify<Data>()
        .id((d) => d.entity)
        .parentId((d) => d.region)

    const strat = stratified(data)
    const totals = data.map((d) => getTotalEnergy(d))
    const min = Math.min(...totals)
    const max = Math.max(...totals)

    const radiusScale = scaleLinear().domain([min, max]).range([5, 800])
    const packdata = pack<Data>()
        .size([width, height])
        .radius((d) => radiusScale(getTotalEnergy(d.data)))
        .padding((d) => {
            if (d.depth === 0) {
                return 20
            } else if (d.depth === 2) {
                return 5
            }
            return 5
        })(strat)
        .sort((a, b) => {
            const aValue = getTotalEnergy(a.data)
            const bValue = getTotalEnergy(b.data)
            return aValue - bValue
        })

    console.log(packdata)
    if (packdata) {
        return packdata
    }
}

export const isVectorInCircle = (x: number, y: number, node: HierarchyCircularNode<Data>) => {
    return x >= node.x - node.r && x <= node.x + node.r && y >= node.y - node.r && y <= node.y + node.r
}
export const searchInQuadTree = ({
    nodes,
    x,
    y,
}: {
    nodes: HierarchyCircularNode<Data>[]
    x: number
    y: number
}): HierarchyCircularNode<Data> | null => {
    const tree = quadtree<HierarchyCircularNode<Data>>()
        .extent([
            [-1, -1],
            [0, 0],
        ])
        .x((d) => d.x)
        .y((d) => d.y)
        .addAll(nodes)
    let result: HierarchyCircularNode<Data> | null = null
    tree.visit((node) => {
        // on leaf node

        if (!node.length) {
            if (isVectorInCircle(x, y, node.data)) {
                const children = node.data.children
                if (children) {
                    const innerTree = quadtree<HierarchyCircularNode<Data>>()
                        .extent([
                            [-1, -1],
                            [0, 0],
                        ])
                        .x((d) => d.x)
                        .y((d) => d.y)
                        .addAll(nodes)
                    const target = children.find((childNode) => isVectorInCircle(x, y, childNode))
                    if (target) {
                        result = target
                    } else {
                        if (isVectorInCircle(x, y, node.data)) {
                            result = node.data
                        }
                    }
                } else {
                    result = node.data
                }
            }
        }
        return result !== null
    })

    return result
}
export const renewableEnergyColorScale = scaleOrdinal<string, string>()
    .domain(['oil', 'coal', 'gas', 'nuclear', 'hydro', 'biofuels', 'wind', 'biomass', 'solar'])
    .range(['#130f40', '#535c68', '#95afc0', '#eb4d4b', '#4834d4', '#22a6b3', '#be2edd', '#6ab04c', '#f9ca24'])
