import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";

export default class OrderRepository implements OrderRepositoryInterface {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(entity: Order): Promise<void> {
    await OrderItemModel.destroy({
      where: {
        order_id: entity.id
      },
    });

    await OrderItemModel.bulkCreate(
      entity.items.map((item) => ({
        id: item.id,
        order_id: entity.id,
        name: item.name,
        price: item.price,
        product_id: item.productId,
        quantity: item.quantity,
      }))
    );

    await OrderModel.update(
      {
        customer_id: entity.customerId,
        total: entity.total(),
      },
      {
        where: {
          id: entity.id,
        },
      }
    );     
  }

  async find(id: string): Promise<Order> {
    let orderModel;
    try {
      orderModel = await OrderModel.findOne({
        where: {
          id,
        },
        include: ["items"],
        rejectOnEmpty: true,
      });
    } catch (error) {
      throw new Error("Order not found");
    }

    const items: OrderItem[] = [];
    orderModel.items.forEach((itemModel) => {
      const item = new OrderItem(
        itemModel.id,
        itemModel.name,
        itemModel.price / itemModel.quantity,
        itemModel.product_id,
        itemModel.quantity
      );

      items.push(item);
    });
    const order = new Order(orderModel.id, orderModel.customer_id, items);

    return order;
  }

  async findAll(): Promise<Order[]> {
    const ordersModel = await OrderModel.findAll({
      include: [
        { model: OrderItemModel }
      ],
    });

    const orders: Order[] = [];

    ordersModel.forEach((orderModel) => {
      const items: OrderItem[] = [];

      orderModel.items.forEach((itemModel) => {
        const item = new OrderItem(
          itemModel.id,
          itemModel.name,
          itemModel.price / itemModel.quantity,
          itemModel.product_id,
          itemModel.quantity
        );

        items.push(item);
      });

      const order = new Order(
        orderModel.id,
        orderModel.customer_id,
        items
      );

      orders.push(order);
    });

    return orders;
  }
}
