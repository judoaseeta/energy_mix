import React, { useMemo } from 'react'
// d3 relate
import { geoMercator, geoPath } from 'd3-geo'
import { getRenewableEnergy, getTotalEnergy, isRenewableEnergy } from './utils'
// types
import { SelectedNodeProps } from './types/view'
import { scaleBand, scaleLinear } from 'd3-scale'
import { Data, renewableEnergies, RenewableEnergy } from './types/entity'
// usecase
import { renewableEnergyColorScale } from './usecase'
export default function SelectedNode({ countries, data, greenScale, vector, worldData }: SelectedNodeProps) {
    const countryPath = useMemo(() => {
        if (data.type === 'non-region') {
            const prj = geoMercator()

            const countryD = countries.features.find((c) => c.properties.name.includes(data.entity))
            if (countryD) {
                prj.fitSize([120, 100], countryD)
                const gpath = geoPath(prj)
                return gpath(countryD)
            }
        }
        return null
    }, [data])
    const renewableEnergy = getRenewableEnergy(data)
    const totalEnergy = getTotalEnergy(data)
    const renewableEnergyWithValues = (
        renewableEnergies.map((energy) => [energy, data[energy]]) as [RenewableEnergy, number][]
    ).sort((a, b) => b[1] - a[1])
    const sumRenewableEnergies = renewableEnergyWithValues.reduce((acc, curr) => acc + curr[1], 0)
    const renewableEnergyLinearScale = useMemo(() => {
        const maxRenewableEnergy = Math.max(data.biofuels, data.biomass, data.hydro, data.solar, data.wind)
        return scaleLinear().domain([0, maxRenewableEnergy]).range([0, 100])
    }, [])
    const renewableEnergyBandScale = scaleBand()
        .domain(renewableEnergyWithValues.map((d) => d[0]))
        .range([0, 100])

    return (
        <div
            className="rounded-sm p-2 fixed top-0 left-0 border border-black  bg-slate-100 shadow-lg"
            style={{
                transform: `translate(${vector.x + 5}px,${vector.y + 5}px)`,
            }}
        >
            <h4>{data.entity}</h4>
            <svg width={240} height={100}>
                {countryPath && <path d={countryPath} fill={greenScale(getRenewableEnergy(data))} stroke="black" />}
                {!countryPath && (
                    <circle cx={60} cy={50} r={48} fill={greenScale(getRenewableEnergy(data))} stroke="black" />
                )}
                {renewableEnergyWithValues
                    .sort((a, b) => a[1] - b[1])
                    .map(([energy, value]) => {
                        const key = `renewable_energy_node_${energy}`
                        const xPos = 130
                        const yPos = renewableEnergyBandScale(energy) || 0
                        const bandWidth = renewableEnergyBandScale.bandwidth()
                        const padding = bandWidth * 0.1
                        const barHeight = bandWidth * 0.8
                        return (
                            <g key={key} transform={`translate(${xPos},${yPos})`}>
                                <rect x={0} y={padding} width={110} height={barHeight} className="fill-slate-600" />
                                <rect
                                    x={0}
                                    y={padding}
                                    width={renewableEnergyLinearScale(value)}
                                    height={barHeight}
                                    fill={renewableEnergyColorScale(energy)}
                                />
                                <text
                                    x={10}
                                    className="text-[0.7rem] fill-white"
                                    textAnchor="start"
                                    y={bandWidth / 2}
                                    alignmentBaseline="middle"
                                >
                                    {energy} - {((value / sumRenewableEnergies) * 100).toFixed(2)}%{' '}
                                </text>
                            </g>
                        )
                    })}
            </svg>
            <p className="flex flex-col text-[0.8rem]">
                <span className="font-bold">Renewable energy ratio: </span>
                {renewableEnergy.toFixed(2)}%
            </p>
            <p className="flex flex-col text-[0.8rem]">
                <span className="font-bold">Total energy consumption: </span>
                <span>{totalEnergy.toFixed(2)} Tera watt</span>
                <span>{((totalEnergy / getTotalEnergy(worldData)) * 100).toFixed(2)}% of the world</span>
            </p>
        </div>
    )
}
