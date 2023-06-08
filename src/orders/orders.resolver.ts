import { Args, Query, Resolver } from '@nestjs/graphql'
import { RetailService } from '../retail_api/retail.service'
import { OrdersResponse } from '../graphql'
import { Order } from 'src/retail_api/types'

@Resolver('Orders')
export class OrdersResolver {
  constructor(private retailService: RetailService) {}

  @Query()
  async getOrders(@Args('page') page: number): Promise<OrdersResponse> {
    const ordersDto =  await this.retailService.orders(page ? { page } : {})
    const orders = ordersDto[0]

    orders.forEach((order) => {
      if (!('site' in order)) {
        const updateOrder: Order = order
        updateOrder.site = ''
      }
    })
    const pagination = ordersDto[1]

    return { orders, pagination }
  }

  @Query()
  async order(@Args('number') id: string) {
    return this.retailService.findOrder(Number(id))
  }
}
