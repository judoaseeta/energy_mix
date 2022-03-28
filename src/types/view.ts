//d3
import { ScaleSequential } from 'd3-scale'
import { HierarchyCircularNode } from 'd3-hierarchy'
import { Data, GeoJsons } from './entity'
import { SimCircularNode, Transformed, Vector } from './usecase'
export interface StackChartProps {
    area: string
    data?: Data[]
}
export interface RegionProps {
    countries: GeoJsons['countries']
    greenScale: ScaleSequential<string, never>
    node: SimCircularNode
    transformed: Transformed
    onMouseOver: (node: HierarchyCircularNode<Data>) => React.MouseEventHandler
}
export interface ScaleBarProps {
    greenScale: ScaleSequential<string, never>
    x: number
    y: number
    width: number
    height: number
}
export interface SelectedNodeProps {
    data: Data
    worldData: Data
    vector: Vector
    countries: GeoJsons['countries']
    greenScale: ScaleSequential<string, never>
}

export interface WorldProps {
    data: Data[]
    year: string
}
