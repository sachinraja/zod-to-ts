import {expect, it} from 'vitest'
import {z} from 'zod'
import {printNode, withGetType, zodToTsMultiple} from '../src'
import {stripIndent} from "./utils";


const address = z.object({
  addressLine1: z.string(),
  addressLine2: z.string()
})

const baseCustomer = z.object({
  name: z.string(),
  age: z.number(),
  addresses: z.array(address),
})

type Customer = z.infer<typeof baseCustomer> & {orders: z.infer<typeof order>[]}

const lazyOrder = withGetType(z.lazy(() => order), ts => ts.factory.createIdentifier('Order'))

const customer: z.ZodType<Customer> = baseCustomer.extend({
  orders: z.array(lazyOrder)
})

const productCategory = z.enum(['groceries', 'apparel', 'toys', 'other'])

const discount = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('percent'),
    percentage: z.number()
  }),
  z.object({
    type: z.literal('fixed'),
    amount: z.number()
  })
])

const product = z.object({
  name: z.string(),
  sku: z.string(),
  category: productCategory,
  discounts: z.array(discount)
})

const order = z.object({
  customer: customer,
  created: z.date(),
  products: z.array(product)
})



it('zodToTsMultiple', () => {

  const zodtoTsResult = zodToTsMultiple({
    Customer: customer,
    Address: address,
    ProductCategory: productCategory,
    Discount: discount,
    Product: product,
    Order: order
  })

  const tsSourceText = zodtoTsResult.typeAliases.map(ta => printNode(ta)).join("\n")

  expect(tsSourceText).toEqual(stripIndent(`
    type Customer = {
        name: string;
        age: number;
        addresses: Address[];
        orders: Order[];
    };
    type Address = {
        addressLine1: string;
        addressLine2: string;
    };
    type ProductCategory = "groceries" | "apparel" | "toys" | "other";
    type Discount = {
        type: "percent";
        percentage: number;
    } | {
        type: "fixed";
        amount: number;
    };
    type Product = {
        name: string;
        sku: string;
        category: ProductCategory;
        discounts: Discount[];
    };
    type Order = {
        customer: Customer;
        created: Date;
        products: Product[];
    };
  `))

})
