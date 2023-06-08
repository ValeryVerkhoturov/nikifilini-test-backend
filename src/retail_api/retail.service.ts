import { Injectable } from '@nestjs/common'
import { CrmType, Order, OrderItem, OrdersFilter, RetailPagination } from './types'
import axios, { AxiosInstance } from 'axios'
import { serialize } from '../tools'
import { plainToClass } from 'class-transformer'

@Injectable()
export class RetailService {
  private readonly axios: AxiosInstance

  constructor() {
    // console.log(process.env.RETAIL_URL)
    this.axios = axios.create({
      baseURL: `${process.env.RETAIL_URL}/api/v5`,
      timeout: 10000,
      headers: { },
    })

    this.axios.interceptors.request.use((config) => {
      // console.log(config.url)
      return config
    })
    this.axios.interceptors.response.use(
      (r) => {
        // console.log("Result:", r.data)
        return r
      },
      (r) => {
        // console.log("Error:", r.response.data)
        return r
      },
    )
  }

  getStatuses(items: Order[] | OrderItem[], code?: boolean ): CrmType[] {
    const statuses = {}
    if (code) {
      items.forEach((item: Order | OrderItem) => {
        if ('delivery' in item) {
          if (item.delivery.code) {
            statuses[item.delivery.code] = item.delivery.code
          }
        }
      })
    } else {
      items.forEach((item: Order | OrderItem) => {
        statuses[item.status] = item.status
      })
    }

    const statusesCrmType: CrmType[] = []
    let i = 0
    for ( const key in statuses) {
      statusesCrmType.push({ name: key, code: String(i++) })
    }

    return statusesCrmType
  }

  async orders(filter?: OrdersFilter): Promise<[Order[], RetailPagination]> {
    const params = serialize({ ...filter, apiKey: process.env.RETAIL_KEY }, '')
    const resp = await this.axios.get('/orders?' + params)

    if (!resp.data) throw new Error('RETAIL CRM ERROR')

    const orders = plainToClass(Order, resp.data.orders as Array<any>)
    const pagination: RetailPagination = resp.data.pagination

    return [orders, pagination]
  }

  async findOrder(id: number): Promise<Order | null> {
    const [orders] = await this.orders({ filter: { ids : [id] } })
    return orders[0]
  }

  async orderStatuses(): Promise<CrmType[]> {
    const [ orders ] = await this.orders({limit: 100})
    return this.getStatuses(orders)
  }

  async productStatuses(): Promise<CrmType[]> {
    const [orders] = await this.orders({limit: 100})

    let products: OrderItem[] = []
    orders.forEach((order) => {
      products = [...products.concat(order.items)]
    }, [] as OrderItem[])

    return this.getStatuses(products)

  }

  async deliveryTypes(): Promise<CrmType[]> {
    const [ orders ] = await this.orders({limit: 100})
    return this.getStatuses(orders, true)
  }
}