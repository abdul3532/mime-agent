export interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  availability: "in_stock" | "low_stock" | "out_of_stock";
  category: string;
  tags: string[];
  margin: number;
  inventory: number;
  url: string;
  image: string;
  boostScore: number;
  included: boolean;
}

const categories = ["Apparel", "Beauty", "Home", "Electronics", "Accessories", "Food & Drink"];
const availabilities: Product["availability"][] = ["in_stock", "low_stock", "out_of_stock"];

const productData: Omit<Product, "id" | "boostScore" | "included">[] = [
  { title: "Merino Wool Crew Neck", price: 89, currency: "EUR", availability: "in_stock", category: "Apparel", tags: ["bestseller", "premium"], margin: 62, inventory: 120, url: "/products/merino-crew", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=80&h=80&fit=crop" },
  { title: "Organic Cotton Tee", price: 35, currency: "EUR", availability: "in_stock", category: "Apparel", tags: ["basics", "sustainable"], margin: 55, inventory: 340, url: "/products/organic-tee", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=80&h=80&fit=crop" },
  { title: "Slim Fit Chinos", price: 75, currency: "EUR", availability: "in_stock", category: "Apparel", tags: ["bestseller"], margin: 58, inventory: 89, url: "/products/slim-chinos", image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=80&h=80&fit=crop" },
  { title: "Linen Summer Shirt", price: 65, currency: "EUR", availability: "low_stock", category: "Apparel", tags: ["seasonal", "new"], margin: 60, inventory: 12, url: "/products/linen-shirt", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=80&h=80&fit=crop" },
  { title: "Denim Jacket Classic", price: 120, currency: "EUR", availability: "in_stock", category: "Apparel", tags: ["premium", "bestseller"], margin: 65, inventory: 45, url: "/products/denim-jacket", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=80&h=80&fit=crop" },
  { title: "Cashmere Scarf", price: 110, currency: "EUR", availability: "in_stock", category: "Accessories", tags: ["premium", "gift"], margin: 70, inventory: 67, url: "/products/cashmere-scarf", image: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=80&h=80&fit=crop" },
  { title: "Leather Weekender Bag", price: 195, currency: "EUR", availability: "in_stock", category: "Accessories", tags: ["premium"], margin: 55, inventory: 23, url: "/products/weekender-bag", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=80&h=80&fit=crop" },
  { title: "Minimalist Watch Silver", price: 159, currency: "EUR", availability: "low_stock", category: "Accessories", tags: ["bestseller", "gift"], margin: 68, inventory: 8, url: "/products/watch-silver", image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=80&h=80&fit=crop" },
  { title: "Sunglasses Aviator", price: 85, currency: "EUR", availability: "in_stock", category: "Accessories", tags: ["seasonal"], margin: 72, inventory: 156, url: "/products/aviator", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=80&h=80&fit=crop" },
  { title: "Vitamin C Serum", price: 42, currency: "EUR", availability: "in_stock", category: "Beauty", tags: ["bestseller", "skincare"], margin: 78, inventory: 520, url: "/products/vitamin-c-serum", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=80&h=80&fit=crop" },
  { title: "Hydrating Face Cream", price: 38, currency: "EUR", availability: "in_stock", category: "Beauty", tags: ["skincare"], margin: 75, inventory: 290, url: "/products/face-cream", image: "https://images.unsplash.com/photo-1570194065650-d99fb4b38b17?w=80&h=80&fit=crop" },
  { title: "Rose Body Oil", price: 29, currency: "EUR", availability: "in_stock", category: "Beauty", tags: ["new", "gift"], margin: 80, inventory: 180, url: "/products/rose-oil", image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=80&h=80&fit=crop" },
  { title: "Matte Lipstick Set", price: 55, currency: "EUR", availability: "low_stock", category: "Beauty", tags: ["gift", "bundle"], margin: 74, inventory: 15, url: "/products/lipstick-set", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=80&h=80&fit=crop" },
  { title: "Retinol Night Cream", price: 48, currency: "EUR", availability: "out_of_stock", category: "Beauty", tags: ["skincare", "premium"], margin: 76, inventory: 0, url: "/products/retinol-cream", image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=80&h=80&fit=crop" },
  { title: "Ceramic Vase Set", price: 65, currency: "EUR", availability: "in_stock", category: "Home", tags: ["new", "decor"], margin: 60, inventory: 78, url: "/products/vase-set", image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=80&h=80&fit=crop" },
  { title: "Linen Throw Blanket", price: 79, currency: "EUR", availability: "in_stock", category: "Home", tags: ["cozy", "bestseller"], margin: 58, inventory: 134, url: "/products/throw-blanket", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=80&h=80&fit=crop" },
  { title: "Scented Candle Trio", price: 45, currency: "EUR", availability: "in_stock", category: "Home", tags: ["gift", "bundle"], margin: 82, inventory: 210, url: "/products/candle-trio", image: "https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=80&h=80&fit=crop" },
  { title: "Bamboo Cutting Board", price: 32, currency: "EUR", availability: "in_stock", category: "Home", tags: ["kitchen", "sustainable"], margin: 65, inventory: 95, url: "/products/cutting-board", image: "https://images.unsplash.com/photo-1544441893-675973e31985?w=80&h=80&fit=crop" },
  { title: "Espresso Machine Pro", price: 349, currency: "EUR", availability: "in_stock", category: "Electronics", tags: ["premium", "bestseller"], margin: 35, inventory: 42, url: "/products/espresso-pro", image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=80&h=80&fit=crop" },
  { title: "Wireless Earbuds", price: 129, currency: "EUR", availability: "in_stock", category: "Electronics", tags: ["tech", "bestseller"], margin: 42, inventory: 230, url: "/products/wireless-earbuds", image: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=80&h=80&fit=crop" },
  { title: "Smart Home Speaker", price: 89, currency: "EUR", availability: "low_stock", category: "Electronics", tags: ["tech", "smart-home"], margin: 38, inventory: 18, url: "/products/smart-speaker", image: "https://images.unsplash.com/photo-1543512214-318c7553f230?w=80&h=80&fit=crop" },
  { title: "Portable Charger 20k", price: 45, currency: "EUR", availability: "in_stock", category: "Electronics", tags: ["tech", "travel"], margin: 48, inventory: 310, url: "/products/portable-charger", image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=80&h=80&fit=crop" },
  { title: "USB-C Hub 7-in-1", price: 59, currency: "EUR", availability: "in_stock", category: "Electronics", tags: ["tech", "accessories"], margin: 52, inventory: 175, url: "/products/usbc-hub", image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=80&h=80&fit=crop" },
  { title: "Artisan Coffee Beans", price: 18, currency: "EUR", availability: "in_stock", category: "Food & Drink", tags: ["organic", "bestseller"], margin: 70, inventory: 450, url: "/products/coffee-beans", image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=80&h=80&fit=crop" },
  { title: "Matcha Powder Premium", price: 24, currency: "EUR", availability: "in_stock", category: "Food & Drink", tags: ["organic", "new"], margin: 75, inventory: 280, url: "/products/matcha", image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=80&h=80&fit=crop" },
  { title: "Dark Chocolate Box", price: 28, currency: "EUR", availability: "in_stock", category: "Food & Drink", tags: ["gift", "premium"], margin: 68, inventory: 190, url: "/products/chocolate-box", image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=80&h=80&fit=crop" },
  { title: "Olive Oil Extra Virgin", price: 22, currency: "EUR", availability: "in_stock", category: "Food & Drink", tags: ["kitchen", "organic"], margin: 60, inventory: 320, url: "/products/olive-oil", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=80&h=80&fit=crop" },
  { title: "Herbal Tea Collection", price: 19, currency: "EUR", availability: "low_stock", category: "Food & Drink", tags: ["gift", "bundle"], margin: 72, inventory: 9, url: "/products/herbal-tea", image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=80&h=80&fit=crop" },
  { title: "Wool Beanie", price: 29, currency: "EUR", availability: "in_stock", category: "Apparel", tags: ["winter", "basics"], margin: 65, inventory: 200, url: "/products/wool-beanie", image: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=80&h=80&fit=crop" },
  { title: "Running Sneakers", price: 135, currency: "EUR", availability: "in_stock", category: "Apparel", tags: ["sport", "new"], margin: 45, inventory: 67, url: "/products/running-sneakers", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&h=80&fit=crop" },
  { title: "Silk Pillowcase", price: 49, currency: "EUR", availability: "in_stock", category: "Home", tags: ["premium", "sleep"], margin: 73, inventory: 145, url: "/products/silk-pillowcase", image: "https://images.unsplash.com/photo-1631049035634-c48d8f1e5c2c?w=80&h=80&fit=crop" },
  { title: "Yoga Mat Premium", price: 59, currency: "EUR", availability: "in_stock", category: "Home", tags: ["fitness", "sustainable"], margin: 55, inventory: 88, url: "/products/yoga-mat", image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=80&h=80&fit=crop" },
  { title: "Noise Cancelling Headphones", price: 249, currency: "EUR", availability: "in_stock", category: "Electronics", tags: ["premium", "tech"], margin: 40, inventory: 55, url: "/products/nc-headphones", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&h=80&fit=crop" },
  { title: "E-Reader Kindle", price: 139, currency: "EUR", availability: "out_of_stock", category: "Electronics", tags: ["tech", "reading"], margin: 25, inventory: 0, url: "/products/e-reader", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop" },
  { title: "Leather Belt Classic", price: 55, currency: "EUR", availability: "in_stock", category: "Accessories", tags: ["basics", "premium"], margin: 68, inventory: 150, url: "/products/leather-belt", image: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=80&h=80&fit=crop" },
  { title: "Canvas Tote Bag", price: 25, currency: "EUR", availability: "in_stock", category: "Accessories", tags: ["sustainable", "basics"], margin: 75, inventory: 400, url: "/products/canvas-tote", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=80&h=80&fit=crop" },
  { title: "Face Mask Sheet Pack", price: 15, currency: "EUR", availability: "in_stock", category: "Beauty", tags: ["skincare", "bundle"], margin: 80, inventory: 600, url: "/products/face-masks", image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=80&h=80&fit=crop" },
  { title: "Dry Shampoo Spray", price: 18, currency: "EUR", availability: "in_stock", category: "Beauty", tags: ["haircare", "bestseller"], margin: 78, inventory: 350, url: "/products/dry-shampoo", image: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=80&h=80&fit=crop" },
  { title: "Protein Bar Box (12pk)", price: 32, currency: "EUR", availability: "in_stock", category: "Food & Drink", tags: ["fitness", "bundle"], margin: 55, inventory: 270, url: "/products/protein-bars", image: "https://images.unsplash.com/photo-1622484212850-eb596d769edc?w=80&h=80&fit=crop" },
  { title: "Sparkling Water 24pk", price: 16, currency: "EUR", availability: "in_stock", category: "Food & Drink", tags: ["basics", "bulk"], margin: 40, inventory: 500, url: "/products/sparkling-water", image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=80&h=80&fit=crop" },
  { title: "Desk Lamp LED", price: 69, currency: "EUR", availability: "in_stock", category: "Home", tags: ["office", "tech"], margin: 58, inventory: 110, url: "/products/desk-lamp", image: "https://images.unsplash.com/photo-1507473885765-e6ed057ab3fe?w=80&h=80&fit=crop" },
  { title: "Plant Pot Ceramic (Set)", price: 38, currency: "EUR", availability: "in_stock", category: "Home", tags: ["decor", "bundle"], margin: 62, inventory: 85, url: "/products/plant-pots", image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=80&h=80&fit=crop" },
];

export const mockProducts: Product[] = productData.map((p, i) => ({
  ...p,
  id: `prod_${String(i + 1).padStart(3, "0")}`,
  boostScore: Math.floor(Math.random() * 6) + 3,
  included: p.availability !== "out_of_stock",
}));

export const getCategories = () => [...new Set(mockProducts.map((p) => p.category))];
export const getTags = () => [...new Set(mockProducts.flatMap((p) => p.tags))];
