// d3
import { InternMap } from 'd3-array'
//  range
import range from 'lodash.range'
// entity
import { Data, renewableEnergies } from '../types/entity'

export function getNameFromInternMap(intern: InternMap<string, InternMap<string, InternMap<string, number>>>): string {
    return Array.isArray(intern) ? (intern[0] ? intern[0] : '') : ''
}
export function getValueFromInternMap(intern: InternMap<string, InternMap<string, InternMap<string, number>>>): string {
    return Array.isArray(intern) ? (intern[0] ? intern[0] : '') : ''
}
export function getTotalEnergy(data: Data) {
    return (
        data.biofuels +
        data.biomass +
        data.coal +
        data.gas +
        data.hydro +
        data.nuclear +
        data.oil +
        data.solar +
        data.wind
    )
}
export function getRenewableEnergy(data: Data) {
    const totalRenewableEnergy = data.biofuels + data.biomass + data.hydro + data.solar + data.wind
    const totalEnergy = getTotalEnergy(data)
    const ratio = (totalRenewableEnergy / totalEnergy) * 100
    return Number.isNaN(ratio) ? 0 : ratio
}
export function isRenewableEnergy(key: string) {
    return renewableEnergies.findIndex((d) => d === key) > -1
}
export function ceilPrecised(num: number, backWardPlace = 2) {
    const getIntLength = num.toFixed(0).length - backWardPlace
    const decimalPlace = Math.pow(10, getIntLength)
    return Math.ceil(num / decimalPlace) * decimalPlace
}
export function findGeoJsonByRegion(region: string) {}

export const getYears = () => range(1965, 2021).map((numYear) => String(numYear))
