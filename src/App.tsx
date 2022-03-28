import React, { useEffect, useMemo, useState } from 'react'

import World from './World'
import StackChart from './StackChart'
// api
import loadCsv from './loadCsv'

// utils
import { getYears } from './utils'
// entity
import { Data } from './types/entity'

//styles
import './index.css'

export default function App() {
    const [area, setArea] = useState('South Korea')
    const onChangeArea: React.ChangeEventHandler<HTMLSelectElement> = (e) => setArea(e.target.value)
    /// year related
    const [year, setYear] = useState('2018')
    const [visualzationType, setVisuType] = useState<'map' | 'country'>('country')
    const onChangeYear: React.ChangeEventHandler<HTMLSelectElement> = (e) => setYear(e.target.value)
    // get initial data
    const getData = async () => {
        const result = await loadCsv()
        setData(result)
    }
    useEffect(() => {
        getData()
    }, [])

    const [data, setData] = useState<Data[]>()
    const areas = useMemo(() => {
        if (data) {
            const set = new Set<string>()
            data.forEach((d) => set.add(d.entity))
            return [...set.values()]
        }
    }, [data])
    return (
        <div className="flex flex-col">
            <nav className="flex w-screen h-[5vh] p-2 bg-green-800 justify-between">
                <div className="flex items-center gap-5 pl-5">
                    <h1 className="text-xl text-white">Energy Mix</h1>
                    {visualzationType === 'map' && (
                        <label htmlFor="year" className="flex h-full gap-2 items-center">
                            <h3 className="text-white">조회 연도: </h3>
                            <select className="p-1" id="year" value={year} onChange={onChangeYear}>
                                {getYears().map((yearItem) => (
                                    <option key={yearItem} value={yearItem}>
                                        {yearItem}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                    {visualzationType === 'country' && data && (
                        <label htmlFor="area" className="flex items-center">
                            <h3 className="text-white">조회 지역: </h3>
                            <select className="p-1" id="area" value={area} onChange={onChangeArea}>
                                {areas?.map((areaItem) => (
                                    <option key={areaItem} value={areaItem}>
                                        {areaItem}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                </div>
                <div className="flex items-center gap-5 pr-5">
                    <a
                        className={`font-bold cursor-pointer hover:underline ${
                            visualzationType === 'map' ? 'text-slate-100' : 'text-black'
                        }`}
                        onClick={() => setVisuType('map')}
                    >
                        연도별 지도
                    </a>
                    <a
                        className={`font-bold cursor-pointer hover:underline ${
                            visualzationType === 'country' ? 'text-slate-100' : 'text-black'
                        }`}
                        onClick={() => setVisuType('country')}
                    >
                        국가별 스택차트
                    </a>
                </div>
            </nav>
            <div className="flex flex-col w-screen h-[90vh] justify-center items-center">
                {data && visualzationType === 'map' && <World data={data} year={year} />}
                {data && visualzationType === 'country' && <StackChart area={area} data={data} />}
            </div>
        </div>
    )
}
// <canvas width={mapWidth} height={mapHeight} ref={canvasRef}></canvas>
