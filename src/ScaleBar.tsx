import React, { useMemo } from 'react'
import { scaleBand } from 'd3-scale'
// types
import { ScaleBarProps } from './types/view'
export default function ScaleBar({ greenScale, x, y, width, height }: ScaleBarProps): JSX.Element {
    const bandScale = useMemo(() => {
        return scaleBand<number>().domain([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]).range([height, 0])
    }, [])
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={width - 10} y={5} textAnchor="end" alignmentBaseline="hanging">
                A color scale of energy mix ratio
            </text>
            <g transform="translate(0,30)">
                <rect x={-width} y={0} height={height + 1} width={width} className="fill-slate-200" />
                {bandScale.domain().map((ratio) => {
                    const key = `scaleBar_color_${ratio}`
                    const bandWidth = bandScale.bandwidth()
                    return (
                        <g key={key} transform={`translate(0,${bandScale(ratio)})`}>
                            <text
                                x={-2}
                                y={bandWidth / 2}
                                textAnchor="end"
                                alignmentBaseline="middle"
                                className="text-[0.6rem]"
                            >
                                {ratio} %
                            </text>
                            <rect y={0} x={0} width={25} height={bandWidth} fill={greenScale(ratio)} stroke="black" />
                        </g>
                    )
                })}
            </g>
        </g>
    )
}
