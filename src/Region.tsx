import React, { useMemo } from 'react'
// d3 relate
import { geoMercator, geoPath } from 'd3-geo'
import { RegionProps } from './types/view'
import { getRenewableEnergy } from './utils'

export default function Region({ countries, greenScale, node, transformed, onMouseOver }: RegionProps) {
    const country = useMemo(() => {
        if (node.data.type === 'non-region') {
            const prj = geoMercator()

            const countryD = countries.features.find((c) => c.properties.name.includes(node.data.entity))

            if (countryD) {
                prj.fitSize([node.r * 1.9, node.r * 1.9], countryD)
                const gpath = geoPath(prj)
                return gpath(countryD)
            }
            return null
        } else {
            return null
        }
    }, [countries, node])
    return (
        <g>
            <g transform={`translate(${transformed.x}, ${transformed.y}) scale(${transformed.scale})`}>
                <g className="select-non" transform={`translate(${node.x}, ${node.y})`} onMouseOver={onMouseOver(node)}>
                    <circle
                        cx={0}
                        cy={0}
                        r={node.r}
                        stroke="black"
                        strokeDasharray={'20 5'}
                        fill="transparent"
                    ></circle>
                    {node.data.type === 'region' && (
                        <circle
                            cx={0}
                            cy={0}
                            r={node.r}
                            stroke={greenScale(getRenewableEnergy(node.data))}
                            fill="transparent"
                            strokeWidth={5}
                        ></circle>
                    )}
                    {country && (
                        <g transform={`translate(${-node.r},${-node.r})`}>
                            <path d={country} fill={greenScale(getRenewableEnergy(node.data))} stroke="black" />
                        </g>
                    )}
                    {!country && node.data.type === 'non-region' && (
                        <circle r={node.r * 0.9} cx={0} cy={0} fill={greenScale(getRenewableEnergy(node.data))} />
                    )}
                    {node.depth === 1 && (
                        <text
                            x={0}
                            y={0}
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            className="text-[2rem] fill-slate-300"
                            transform={`rotate(-45)`}
                        >
                            {node.data.entity}
                        </text>
                    )}
                </g>
            </g>

            {node.children?.map((childNode) => {
                const key = `childNode_${node.data.entity}_${childNode.data.entity}`
                return (
                    <Region
                        countries={countries}
                        greenScale={greenScale}
                        key={key}
                        transformed={transformed}
                        node={childNode}
                        onMouseOver={onMouseOver}
                    />
                )
            })}
        </g>
    )
}

/**
 *    {node &&
                node.children?.map((childNode) => {
                    const key = `childNode_${node.data.entity}_${childNode.data.entity}`
                    return (
                        <g key={key}>
                            <circle cx={childNode.x} cy={childNode.y} r={childNode.r} fill="grey"></circle>
                        </g>
                    )
                })}
 */
