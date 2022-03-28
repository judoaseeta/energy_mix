// usecase
import { getRenewableEnergy, getTotalEnergy } from '../utils'
// types
import { Data, GeoJsons } from '../types/entity'
import { SimCircularNode } from '../types/usecase'
//d3 related
import { pack } from 'd3-hierarchy'
import { geoEqualEarth, geoPath } from 'd3-geo'
import { ScaleSequential } from 'd3-scale'
export function drawChildNodes(
    ctx: CanvasRenderingContext2D,
    parentNode: SimCircularNode,
    countries: GeoJsons['countries'],
    greenScale: ScaleSequential<string, never>,
) {
    ctx.beginPath()

    const childPack = pack<Data>()
        .padding(40)
        .size([parentNode.r * 1.8, parentNode.r * 1.8])(parentNode.copy())
        .sort((a, b) => getTotalEnergy(b.data) - getTotalEnergy(a.data))
    const prj = geoEqualEarth()
    parentNode.children?.forEach((childNode, childnNodeIndex) => {
        const countryD = countries.features.find((c) => c.properties.name.includes(childNode.data.entity))
        prj.translate([childNode.x, childNode.y])
        ctx.save()

        ctx.beginPath()
        ctx.save()
        ctx.setLineDash([4, 8])
        ctx.strokeStyle = '#95afc0'

        ctx.arc(childNode.x, childNode.y, childNode.r, 0, Math.PI * 2)

        ctx.stroke()
        ctx.restore()
        ctx.closePath()

        if (countryD) {
            prj.fitSize([childNode.r * 1.8, childNode.r * 1.8], countryD)

            const gpath = geoPath(prj).context(ctx)
            ctx.beginPath()
            ctx.save()
            ctx.strokeStyle = 'black'

            ctx.translate(childNode.x - childNode.r, childNode.y - childNode.r)
            gpath(countryD!)

            ctx.fillStyle = greenScale(getRenewableEnergy(childNode.data))
            ctx.fill()
            ctx.stroke()
            ctx.restore()
            ctx.closePath()
        } else if (childNode.data.type === 'non-region') {
            ctx.beginPath()
            ctx.save()
            ctx.strokeStyle = 'black'

            ctx.translate(childNode.x, childNode.y)
            ctx.arc(0, 0, childNode.r * 0.8, 0, Math.PI * 2)
            ctx.fillStyle = greenScale(getRenewableEnergy(childNode.data))
            ctx.fill()
            ctx.stroke()
            ctx.restore()
            ctx.closePath()
        }
        if (!childNode.children) {
            ctx.save()

            ctx.font = '0.5rem Arial'

            ctx.translate(childNode.x, childNode.y)
            ctx.globalAlpha = 0.6
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = 'red'

            ctx.fillText(childNode.data.entity, 0, 0)

            ctx.restore()
        } else {
            drawChildNodes(ctx, childNode, countries, greenScale)
        }
        ctx.restore()
    })

    ctx.closePath()
}
