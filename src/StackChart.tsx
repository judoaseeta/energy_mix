import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// d3
import { scaleBand, scaleLinear, scaleOrdinal, scaleTime } from 'd3-scale'
import { area as areaG, SeriesPoint } from 'd3-shape'
import { bisector } from 'd3-array'
// entity
import { Data } from './types/entity'
// type - usecase
import { DataRect } from './types/usecase'
// usecase
import { createStack } from './usecase'
// utils
import { ceilPrecised, getTotalEnergy, isRenewableEnergy } from './utils'
// types
import { StackChartProps } from './types/view'

export default function StackChart({ area, data }: StackChartProps): JSX.Element {
    const filteredByArea = useMemo(() => {
        if (data) {
            return data.filter((d) => d.entity === area)
        }
    }, [area, data])
    const chartHeight = window.innerHeight * 0.7
    const chartWidth = window.innerWidth * 0.7
    const paddingWidth = window.innerWidth * 0.1
    const timelines = useMemo(() => {
        if (filteredByArea) {
            return filteredByArea.map((d) => d.year)
        }
    }, [filteredByArea])
    const timeScale = useMemo(() => {
        if (timelines) {
            const dates = timelines.map((timeline) => new Date(timeline))
            return scaleTime()
                .domain([dates[0], dates[dates.length - 1]])
                .range([0, chartWidth])
        }
    }, [timelines])
    const colorScale = scaleOrdinal<string, string>()
        .domain(['oil', 'coal', 'gas', 'nuclear', 'hydro', 'biofuels', 'wind', 'biomass', 'solar'])
        .range(['#130f40', '#535c68', '#95afc0', '#eb4d4b', '#4834d4', '#22a6b3', '#be2edd', '#6ab04c', '#f9ca24'])
    const stacked = useMemo(() => {
        if (filteredByArea) {
            const stackFunc = createStack()
            return stackFunc(filteredByArea)
        }
    }, [filteredByArea])
    const yScale = useMemo(() => {
        if (stacked) {
            let maxNum = -Infinity
            for (let i = 0; i < stacked.length; i += 1) {
                for (let j = 0; j < stacked[i].length; j += 1) {
                    const point = stacked[i][j]
                    const currentMaxNum = Math.max(point[0], point[1])
                    maxNum = Math.max(currentMaxNum, maxNum)
                }
            }

            return scaleLinear()
                .domain([0, ceilPrecised(maxNum)])
                .range([chartHeight, 0])
        }
    }, [stacked])
    // canvas related
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    // hover relatred
    const [hoveredEnergyType, setHoveredEnergyType] = useState('')
    const onPointerDownEnergyType = (energyType: string) => () => {
        setHoveredEnergyType(energyType)
    }
    const onPointerLeaveEnergyType = () => setHoveredEnergyType('')
    useEffect(() => {
        const canvas = canvasRef.current
        if (canvas) {
            const ctx = canvas.getContext('2d')
            if (ctx && yScale && stacked && colorScale && timeScale && timelines) {
                ctx.clearRect(0, 0, canvas.width, canvas.height)

                const yTicks = yScale.ticks()
                yTicks.forEach((yTick) => {
                    const yPos = yScale(yTick)
                    ctx.beginPath()
                    ctx.save()
                    ctx.setLineDash([4, 8])
                    ctx.moveTo(0, yPos)
                    ctx.lineTo(canvas.width, yPos)
                    ctx.lineWidth = 0.25

                    ctx.fillStyle = '#dfe4ea'
                    ctx.stroke()
                    ctx.restore()
                    ctx.closePath()
                })
                const areaGenerator = areaG<SeriesPoint<Data>>()
                    .y0((d) => yScale(d[0]))
                    .y1((d) => yScale(d[1]))
                    .x((_, i) => timeScale(new Date(timelines[i])))
                stacked.forEach((stackData) => {
                    const boundedArea = areaGenerator.context(ctx)
                    ctx.beginPath()
                    ctx.save()
                    ctx.fillStyle = colorScale(stackData.key)
                    boundedArea(stackData)

                    ctx.globalAlpha = !hoveredEnergyType ? 1 : hoveredEnergyType === stackData.key ? 1 : 0.2
                    ctx.fill()

                    ctx.restore()
                    ctx.closePath()
                })
            }
        }
    }, [canvasRef, stacked, hoveredEnergyType, yScale, timeScale, colorScale, timelines])
    const energyKeys = useMemo(() => {
        if (stacked) {
            return stacked.sort((a, b) => b.index - a.index).map((data) => data.key)
        }
    }, [stacked])
    const energyKeyBandScale = useMemo(() => {
        if (energyKeys) {
            return scaleBand()
                .domain(energyKeys)
                .range([0, chartHeight * 0.8])
        }
    }, [energyKeys])

    // interact related
    const [hoverRect, setHoverRect] = useState<DataRect<Data> | null>(null)
    const interactCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const onInteract: React.MouseEventHandler = useCallback(
        (e) => {
            const interactCanvas = interactCanvasRef.current
            if (interactCanvas && timeScale && stacked && colorScale && timelines && yScale) {
                const target = e.target as HTMLCanvasElement
                const { left } = target.getBoundingClientRect()
                const mouseX = e.clientX - left

                const dataBisector = bisector<string, Date>((d) => new Date(d))
                const invertedDate = timeScale.invert(mouseX)
                const targetIndex = dataBisector.center(timelines, invertedDate)
                const energyStacks: [string, number, Data][] = stacked.flatMap((d) => [
                    [d.key, d[targetIndex][1], d[targetIndex].data],
                ])
                const ctx = interactCanvas.getContext('2d')
                if (ctx && energyStacks.every((tuple) => tuple[1] > 0)) {
                    ctx.clearRect(0, 0, interactCanvas.width, interactCanvas.height)
                    energyStacks.forEach((energyStack) => {
                        const key = energyStack[0]
                        const yPos = yScale(energyStack[1])
                        const color = colorScale(energyStack[0])
                        ctx.beginPath()
                        ctx.save()
                        ctx.arc(timeScale(new Date(timelines[targetIndex])), yPos, 4, 0, Math.PI * 2)
                        ctx.strokeStyle = key === 'oil' || key === 'coal' ? 'white' : 'black'
                        ctx.lineWidth = 1
                        ctx.fillStyle = color
                        ctx.fill()
                        ctx.stroke()
                        ctx.restore()
                        ctx.closePath()
                    })
                    // pick the most bottom one
                    const bottomStack = energyStacks[energyStacks.length - 1]
                    const bottomYPos = yScale(bottomStack[1])
                    const hoverItemHeight = chartHeight * 0.8
                    const hoverItemYPos = chartHeight * 0.1

                    setHoverRect({
                        x: mouseX,
                        y: hoverItemYPos,
                        width: chartWidth * 0.3,
                        height: hoverItemHeight,
                        data: energyStacks[0][2],
                    })
                } else {
                    ctx?.clearRect(0, 0, interactCanvas.width, interactCanvas.height)
                    setHoverRect(null)
                }
            }
        },
        [chartWidth, chartHeight, interactCanvasRef, timeScale, stacked, timelines, paddingWidth, colorScale, yScale],
    )
    const onInteractEnd = useCallback(() => {
        const interactCanvas = interactCanvasRef.current
        if (interactCanvas) {
            const ctx = interactCanvas.getContext('2d')
            if (ctx) {
                ctx.clearRect(0, 0, interactCanvas.width, interactCanvas.height)
                setHoverRect(null)
            }
        }
    }, [interactCanvasRef])
    return (
        <div className="w-full h-full flex items-center">
            <div className="w-[15vw] h-full flex justify-end items-center">
                <svg width={paddingWidth} height={window.innerHeight * 0.95}>
                    <g transform={`translate(0, ${window.innerHeight * 0.125})`}>
                        {yScale &&
                            yScale.ticks().map((yTick) => {
                                const key = `mainChart_tick_${yTick}`
                                const yPos = yScale(yTick)
                                if (yTick !== 0) {
                                    return (
                                        <g key={key}>
                                            <text
                                                x={paddingWidth - 5}
                                                y={yPos}
                                                alignmentBaseline="middle"
                                                textAnchor="end"
                                                className="text-[0.8rem]"
                                            >
                                                {yTick}
                                            </text>
                                            <rect y={yPos} x={paddingWidth - 3} width={3} height={2} fill="black" />
                                        </g>
                                    )
                                }
                                return null
                            })}
                    </g>
                </svg>
            </div>
            <div className="flex flex-col justify-center items-center w-[70vw] h-[70vh]">
                <div className="relative">
                    <canvas
                        ref={canvasRef}
                        width={chartWidth}
                        height={chartHeight}
                        className="border bg-[#ecf0f1] border-slate-700"
                    ></canvas>
                    {hoverRect && energyKeys && colorScale && (
                        <div
                            className="flex flex-col w-auto items-center justify-center p-2 rounded-md bg-white/90 border border-black"
                            style={{
                                position: 'absolute',
                                top: hoverRect.y,
                                left: hoverRect.x,
                                width: `${hoverRect.width}px`,
                                transform: hoverRect.x < chartWidth / 2 ? 'translate(10%,0)' : 'translate(-110%,0)',
                                height: `${hoverRect.height}px`,
                            }}
                        >
                            <h2>Energy Mix - {hoverRect.data.year}</h2>
                            <table className="w-full h-full border border-collapse">
                                <tbody className="h-[20rem]">
                                    <tr className="h-[2rem]">
                                        <th
                                            className="text-xs border"
                                            style={{
                                                backgroundColor: 'white',
                                                color: 'black',
                                            }}
                                        >
                                            TOTAL
                                        </th>
                                        <td className="text-xs border text-center font-bold">
                                            {parseFloat(String(getTotalEnergy(hoverRect.data))).toFixed(2)} TWh
                                        </td>
                                    </tr>
                                    {energyKeys.map((energyKey) => {
                                        const energyData = hoverRect.data[energyKey as keyof Data]
                                        const key = `hoverRect_table_${energyKey}`

                                        if (energyData > 0) {
                                            return (
                                                <tr
                                                    key={key}
                                                    className={`h-[2rem] ${
                                                        isRenewableEnergy(energyKey) ? 'border-2 border-green-700' : ''
                                                    }`}
                                                >
                                                    <th
                                                        className="text-xs border"
                                                        style={{
                                                            backgroundColor: 'white',
                                                            color: colorScale(energyKey),
                                                        }}
                                                    >
                                                        {energyKey}
                                                    </th>
                                                    <td className="text-xs border text-center">
                                                        {parseFloat(String(energyData)).toFixed(2)} TWh
                                                    </td>
                                                </tr>
                                            )
                                        }
                                        return null
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <canvas
                        width={chartWidth}
                        height={chartHeight}
                        className="absolute top-0 left-0 border border-transparent  z-20 bg-transparent"
                        onMouseMove={onInteract}
                        onMouseLeave={onInteractEnd}
                        ref={interactCanvasRef}
                    ></canvas>
                </div>
                <div className="w-full flex justify-center h-[5vh]">
                    <svg width={chartWidth} height={window.innerHeight * 0.05}>
                        {timeScale &&
                            timeScale.ticks(20).map((timeTick) => {
                                const key = `mainChart_timeTick-${timeTick.getFullYear()}`
                                const xPos = timeScale(timeTick)
                                return (
                                    <g key={key}>
                                        <rect x={xPos - 0.5} y={0} width={1} height={4} fill="black" />
                                        <text
                                            className="text-[0.7rem]"
                                            alignmentBaseline="middle"
                                            textAnchor="end"
                                            transform={`translate(${xPos}, ${10}) rotate(-45)`}
                                        >
                                            {timeTick.getFullYear()}
                                        </text>
                                    </g>
                                )
                            })}
                    </svg>
                </div>
            </div>
            <div className="w-[15vw] h-full">
                <svg width={paddingWidth * 0.9} height={chartHeight}>
                    <g transform={`translate(0, ${chartHeight * 0.1})`}>
                        {energyKeyBandScale &&
                            energyKeys &&
                            energyKeys.map((energyKey) => {
                                const key = `energy_tick_${energyKey}`
                                const yPos = energyKeyBandScale(energyKey) || 0
                                const bandWidth = energyKeyBandScale.bandwidth()
                                const keyColor = colorScale(energyKey)
                                return (
                                    <g
                                        className="hover:cursor-pointer"
                                        key={key}
                                        transform={`translate(10, ${yPos})`}
                                        onPointerEnter={onPointerDownEnergyType(energyKey)}
                                        onPointerLeave={onPointerLeaveEnergyType}
                                    >
                                        <rect
                                            x={0}
                                            y={bandWidth * 0.2}
                                            width={bandWidth * 0.6}
                                            height={bandWidth * 0.6}
                                            fill={keyColor}
                                            stroke="lightgrey"
                                            strokeWidth={3}
                                            rx={5}
                                            ry={5}
                                        />
                                        <text
                                            x={bandWidth * 0.8}
                                            y={bandWidth / 2}
                                            alignmentBaseline="middle"
                                            fill={keyColor}
                                            className="text-[0.7rem] hover:text-"
                                        >
                                            {energyKey}
                                        </text>
                                    </g>
                                )
                            })}
                    </g>
                </svg>
            </div>
        </div>
    )
}
