import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
//d3

import { scaleSequential } from 'd3-scale'
import { interpolateGreens } from 'd3-scale-chromatic'
import { select } from 'd3-selection'
import { D3ZoomEvent, zoom } from 'd3-zoom'
import { HierarchyCircularNode } from 'd3-hierarchy'
import loadGeoJSON from './loadGeoJson'
// entity
import { Data, GeoJsons } from './types/entity'
// usecase
import { Vector } from './types/usecase'
// canvas
import { drawChildNodes } from './canvas'
// props
import { WorldProps } from './types/view'
// usecase
import { createPackedData } from './usecase'
// component
import Region from './Region'
import ScaleBar from './ScaleBar'
import SelectedNode from './SelectedNode'
export default function World({ data, year }: WorldProps) {
    const [geoJsons, setGeoJsons] = useState<GeoJsons>()
    const getGeoJsons = async () => {
        const geoJson = await loadGeoJSON()
        setGeoJsons(geoJson)
    }
    useEffect(() => {
        getGeoJsons()
    }, [])
    const filteredByYear = useMemo(() => {
        if (data) {
            return data.filter((d) => d.year === year)
        }
    }, [data, year])
    const greenScale = useMemo(() => {
        if (filteredByYear) {
            return scaleSequential().domain([0, 100]).interpolator(interpolateGreens)
        }
    }, [filteredByYear])
    const mapWidth = window.innerWidth * 0.9
    const mapHeight = window.innerHeight * 0.8
    const packed = useMemo(() => {
        if (filteredByYear) {
            return createPackedData(filteredByYear, mapWidth, mapHeight * 0.9)
        }
    }, [mapWidth, mapHeight, filteredByYear])
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const [transformed, setTransformed] = useState<{
        x: number
        y: number
        scale: number
    }>({
        x: 0,
        y: 0,
        scale: 1,
    })
    useEffect(() => {
        const canvas = canvasRef.current
        if (canvas) {
            const ctx = canvas.getContext('2d')
            if (ctx && packed) {
                const width = canvas.width
                const height = canvas.height
                ctx.clearRect(0, 0, width, height)
                ctx.save()
                ctx.translate(transformed.x, transformed.y)
                ctx.scale(transformed.scale, transformed.scale)

                packed.children?.forEach((node) => {
                    ctx.beginPath()
                    ctx.save()
                    ctx.globalAlpha = 0.6

                    ctx.strokeStyle = 'black'
                    ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)

                    ctx.stroke()
                    ctx.restore()
                    ctx.save()

                    ctx.font = '2rem Arial'
                    ctx.translate(node.x - node.r, node.y + node.r * 0.5)
                    ctx.rotate(Math.PI / 3)
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'middle'
                    ctx.strokeStyle = '#dcdde1'

                    ctx.strokeText(node.data.entity, 0, 0)

                    ctx.restore()
                    ctx.closePath()
                    if (node.children && geoJsons && greenScale) {
                        drawChildNodes(ctx, node, geoJsons.countries, greenScale)
                    }
                })
                ctx.restore()
            }
        }
    }, [canvasRef, geoJsons, greenScale, transformed, packed])

    const preventer = useCallback((e: Event) => e.preventDefault(), [])

    const interacterRef = useRef<SVGSVGElement | null>(null)
    const [isZooming, setIsZooming] = useState(false)
    useEffect(() => {
        const interacter = interacterRef.current
        if (interacter) {
            const zoomfunc = zoom()
                .scaleExtent([1, 8])
                .on('zoom', (d: D3ZoomEvent<HTMLDivElement, null>) => {
                    setTransformed({
                        scale: d.transform.k,
                        x: d.transform.x,
                        y: d.transform.y,
                    })
                })
                .on('start', () => {
                    setIsZooming(true)
                })
                .on('end', () => {
                    setIsZooming(false)
                })
            select(interacter).call(zoomfunc as any)
        }
    }, [interacterRef])
    const [selectedNode, setSelectedNode] = useState<{
        node: HierarchyCircularNode<Data>
        vector: Vector
    } | null>(null)

    const onMouseOverNode: (node: HierarchyCircularNode<Data>) => React.MouseEventHandler = useCallback(
        (node) => (e) => {
            const x = e.clientX
            const y = e.clientY
            setSelectedNode({
                node,
                vector: {
                    x,
                    y,
                },
            })
        },
        [],
    )
    const onMouseOutNode: React.MouseEventHandler = () => {
        setSelectedNode(null)
    }
    return (
        <div className="w-full h-full flex flex-col">
            <div className="w-full h-full flex justify-center items-center overflow-hidden relative">
                {packed && geoJsons && greenScale && selectedNode && !isZooming && (
                    <SelectedNode
                        countries={geoJsons.countries}
                        greenScale={greenScale}
                        data={selectedNode.node.data}
                        vector={selectedNode.vector}
                        worldData={packed.data}
                    />
                )}
                <svg
                    className="select-none border border-black"
                    width={mapWidth}
                    height={mapHeight}
                    onContextMenu={(e) => {
                        e.preventDefault()
                        setTransformed({
                            x: 0,
                            y: 0,
                            scale: 1,
                        })
                    }}
                    // onWheel={onWheel}
                    onPointerEnter={() => {
                        window.addEventListener('wheel', preventer, { passive: false })
                    }}
                    onPointerOut={() => {
                        window.removeEventListener('wheel', preventer)
                    }}
                    onMouseOut={onMouseOutNode}
                    ref={interacterRef}
                >
                    <rect
                        // onMouseEnter={onMouseOutNode}
                        x={0}
                        y={0}
                        width={mapWidth}
                        height={mapHeight}
                        fill="transparent"
                        stroke="none"
                    />
                    {geoJsons &&
                        greenScale &&
                        packed &&
                        packed.children?.map((childNode) => {
                            const key = `cdn_${childNode.data.entity}`
                            return (
                                <Region
                                    greenScale={greenScale}
                                    countries={geoJsons.countries}
                                    transformed={transformed}
                                    node={childNode}
                                    key={key}
                                    onMouseOver={onMouseOverNode}
                                />
                            )
                        })}
                    {greenScale && (
                        <ScaleBar greenScale={greenScale} x={mapWidth - 30} y={0} width={30} height={mapHeight * 0.4} />
                    )}
                </svg>
            </div>
        </div>
    )
}
