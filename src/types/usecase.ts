import { SimulationNodeDatum } from 'd3-force'
import { HierarchyCircularNode } from 'd3-hierarchy'
import { Data } from './entity'
export interface Vector {
    x: number
    y: number
}

export interface Rect extends Vector {
    width: number
    height: number
}
export interface DataRect<T> extends Rect {
    data: T
}
export type SimCircularNode = HierarchyCircularNode<Data> & SimulationNodeDatum
export type Transformed = {
    x: number
    y: number
    scale: number
}
