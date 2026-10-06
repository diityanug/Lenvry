import { FoodCategory, FoodItem } from '../types/nutrition';

/**
 * Brand menu database (fast food, restaurants, coffee & tea chains in Indonesia).
 * Values are APPROXIMATE per-serving estimates (based on brand-published / public
 * nutrition info and standard recipes) and converted to per-100g for FoodItem.
 * Row: [name, servingGrams (ml for drinks), kcal, protein, carbs, fat]
 */
type Row = [string, number, number, number, number, number];

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

const round1 = (n: number) => Math.round(n * 10) / 10;

function build(brand: string, category: FoodCategory, rows: Row[]): FoodItem[] {
  return rows.map(([name, grams, kcal, protein, carbs, fat]) => {
    const f = 100 / grams;
    const isDrink = category === 'Dairy & Drinks';
    return {
      id: `brand_${slug(brand)}_${slug(name)}`,
      name: `${brand} ${name}`,
      indonesianName: `${brand} ${name}`,
      category,
      calories: Math.round(kcal * f),
      protein: round1(protein * f),
      carbs: round1(carbs * f),
      fat: round1(fat * f),
      defaultServingText: isDrink ? `1 Gelas (${grams}ml)` : `1 Porsi (${grams}g)`,
      defaultServingGrams: grams,
    };
  });
}

// ===================== FAST FOOD =====================

const KFC_MAINS: Row[] = [
  ['Original Recipe Ayam (Paha Atas)', 120, 320, 22, 10, 21],
  ['Original Recipe Ayam (Paha Bawah)', 90, 220, 17, 7, 14],
  ['Original Recipe Ayam (Dada)', 150, 390, 32, 13, 24],
  ['Original Recipe Ayam (Sayap)', 60, 180, 11, 7, 12],
  ['Crispy Ayam (Paha Atas)', 130, 360, 22, 14, 24],
  ['Crispy Ayam (Dada)', 160, 420, 31, 16, 26],
  ['Hot & Spicy Ayam (Dada)', 150, 380, 31, 13, 23],
  ['Hot Wings (3 pcs)', 120, 330, 20, 14, 21],
  ['Chicken Strips (3 pcs)', 110, 300, 18, 18, 17],
  ['Chicken Popcorn Medium', 100, 270, 15, 17, 16],
  ['Zinger Burger', 190, 470, 22, 40, 24],
  ['Twister', 220, 460, 18, 45, 22],
  ['Longer Burger', 150, 360, 17, 33, 18],
  ['Colonel Burger', 170, 400, 20, 35, 20],
  ['Snack Plate (Ayam + Nasi)', 280, 520, 24, 62, 20],
  ['Rice Bowl Chicken Teriyaki', 330, 560, 26, 72, 18],
  ['Rice Bowl Chicken Spicy BBQ', 330, 570, 25, 74, 19],
  ['Rice Bowl Chicken Butter', 330, 580, 25, 71, 21],
  ['Rice Bowl Chicken Gulai Padang', 330, 600, 24, 73, 23],
  ['Oriental Bento Nasi Ayam', 380, 640, 30, 80, 22],
  ['Oriental Bento Nasi Ayam Teriyaki', 380, 620, 29, 82, 20],
  ['Fiesta Bucket Paket Ayam (1 pcs)', 120, 320, 22, 10, 21],
  ['Paket Nasi Ayam Original', 330, 560, 27, 68, 20],
  ['Paket Nasi Ayam Crispy', 340, 600, 26, 70, 24],
  ['Paket Nasi Ayam Hot & Spicy', 330, 560, 27, 68, 20],
  ['Paket Hemat 1 (Ayam + Nasi + Minum)', 450, 680, 28, 90, 22],
  ['Paket Hemat 2 (Ayam + Fries + Minum)', 400, 740, 26, 85, 32],
  ['Spaghetti Bolognese', 250, 420, 14, 60, 14],
  ['Egg Tart', 70, 190, 3, 20, 11],
];

const KFC_SIDES: Row[] = [
  ['French Fries Regular', 100, 300, 4, 38, 15],
  ['French Fries Large', 150, 450, 6, 57, 22],
  ['Mashed Potato', 120, 120, 2, 18, 5],
  ['Coleslaw', 100, 150, 1, 11, 11],
  ['Corn on the Cob', 100, 90, 3, 20, 1],
  ['Nasi Putih KFC', 150, 195, 4, 43, 0.5],
  ['Perkedel Kentang', 50, 90, 2, 11, 4],
  ['Bubur Ayam', 250, 230, 9, 38, 4],
];

const KFC_DRINKS: Row[] = [
  ['Pepsi Medium', 360, 150, 0, 41, 0],
  ['Lipton Iced Tea', 360, 110, 0, 28, 0],
  ['Float Pepsi', 300, 240, 3, 45, 5],
  ['Es Krim Sundae Coklat', 150, 230, 4, 36, 8],
  ['Es Krim Cone', 90, 140, 3, 22, 5],
];

const MCD_BURGERS: Row[] = [
  ['Big Mac', 215, 550, 25, 45, 30],
  ['Big Mac Double', 300, 760, 40, 46, 43],
  ['Cheeseburger', 119, 300, 15, 33, 12],
  ['Double Cheeseburger', 165, 440, 25, 34, 24],
  ['Hamburger', 105, 250, 12, 31, 9],
  ['McChicken', 150, 400, 14, 40, 21],
  ['McSpicy Chicken Burger', 190, 460, 21, 40, 23],
  ['Filet-O-Fish', 140, 340, 15, 38, 14],
  ['Quarter Pounder with Cheese', 200, 520, 30, 41, 26],
  ['Beef Burger Deluxe', 190, 480, 22, 42, 25],
  ['Egg McMuffin', 135, 300, 17, 30, 12],
  ['Sausage McMuffin with Egg', 165, 450, 21, 30, 27],
  ['Hotcakes with Sausage', 220, 600, 14, 70, 29],
  ['Hotcakes', 170, 340, 8, 60, 7],
  ['Burger McMuffin', 125, 310, 14, 29, 15],
];

const MCD_CHICKEN_SIDES: Row[] = [
  ['Ayam Goreng McD (1 pcs Paha Bawah)', 100, 250, 17, 10, 16],
  ['Ayam Goreng McD (1 pcs Dada)', 150, 340, 26, 12, 22],
  ['Ayam Goreng McD Spicy (1 pcs Dada)', 150, 340, 26, 12, 22],
  ['Ayam Goreng McD Spicy (1 pcs Paha)', 100, 250, 17, 10, 16],
  ['Chicken McNuggets 6 pcs', 100, 280, 15, 17, 18],
  ['Chicken McNuggets 9 pcs', 150, 420, 22, 25, 26],
  ['McWings 2 pcs', 100, 260, 15, 12, 17],
  ['Fries Regular', 100, 300, 4, 38, 15],
  ['Fries Large', 150, 450, 6, 57, 22],
  ['Nasi Putih McD', 150, 195, 4, 43, 0.5],
  ['Apple Pie', 80, 230, 2, 29, 12],
  ['McFlurry Oreo', 200, 340, 7, 50, 12],
  ['McFlurry Choco', 200, 350, 7, 52, 12],
  ['Sundae Strawberry', 150, 220, 4, 38, 6],
  ['Sundae Chocolate', 150, 240, 4, 40, 7],
  ['Cone Vanilla', 90, 150, 4, 24, 4],
  ['Paket Hemat Ayam + Nasi + Minum', 420, 650, 28, 85, 21],
  ['Paket Burger + Fries + Minum', 480, 900, 28, 100, 40],
];

const MCD_DRINKS: Row[] = [
  ['Coca-Cola Medium', 360, 150, 0, 40, 0],
  ['Sprite Medium', 360, 140, 0, 36, 0],
  ['Fanta Medium', 360, 150, 0, 40, 0],
  ['Iced Lemon Tea', 360, 100, 0, 25, 0],
  ['Milo', 300, 180, 6, 28, 5],
  ['Fruit Tea Lychee', 360, 120, 0, 30, 0],
  ['Latte', 250, 140, 8, 12, 7],
  ['Iced Coffee', 360, 110, 3, 20, 2],
];

const BK_ROWS: Row[] = [
  ['Whopper', 270, 660, 28, 49, 40],
  ['Whopper Jr', 160, 360, 15, 31, 20],
  ['Double Whopper', 350, 900, 48, 49, 57],
  ['Triple Whopper', 440, 1120, 66, 49, 76],
  ['Whopper with Cheese', 290, 740, 32, 50, 46],
  ['Cheeseburger', 120, 290, 15, 28, 12],
  ['Double Cheeseburger', 170, 440, 26, 28, 24],
  ['Bacon Double Cheeseburger', 190, 500, 28, 28, 29],
  ['Chicken Royale', 220, 570, 24, 52, 29],
  ['Crispy Chicken Burger', 190, 490, 20, 45, 25],
  ['Spicy Chicken Burger', 200, 510, 21, 46, 26],
  ['BBQ Bacon Cheese Burger', 240, 610, 32, 47, 33],
  ['Mushroom Swiss Burger', 250, 620, 31, 48, 34],
  ['Fish Burger', 160, 380, 16, 42, 16],
  ['King Fish Fillet Burger', 170, 400, 17, 42, 17],
  ['Veggie Burger', 190, 410, 14, 50, 18],
  ['Chicken Nuggets 6 pcs', 100, 270, 14, 18, 16],
  ['Chicken Nuggets 9 pcs', 150, 400, 21, 27, 24],
  ['Chicken Fries 9 pcs', 100, 290, 13, 20, 18],
  ['Onion Rings Medium', 120, 350, 4, 40, 19],
  ['French Fries Medium', 115, 340, 4, 43, 17],
  ['French Fries Large', 150, 440, 5, 56, 22],
  ['Ayam Goreng BK (1 pcs)', 120, 290, 20, 11, 18],
  ['Rice Bowl Chicken Teriyaki BK', 330, 560, 26, 72, 18],
  ['Rice Bowl Beef BK', 330, 590, 25, 70, 22],
  ['Sundae Chocolate', 150, 240, 4, 40, 7],
  ['Hershey\'s Sundae Pie', 100, 310, 4, 37, 16],
  ['Egg & Cheese Croissan\'wich', 120, 340, 14, 27, 20],
  ['King Combo Whopper + Fries + Minum', 520, 1100, 32, 120, 50],
];

const BK_DRINKS: Row[] = [
  ['Coca-Cola Medium', 360, 150, 0, 40, 0],
  ['Iced Tea', 360, 100, 0, 25, 0],
  ['Milkshake Chocolate', 360, 420, 10, 66, 13],
  ['Milkshake Vanilla', 360, 390, 10, 58, 13],
];

const SOLARIA_ROWS: Row[] = [
  ['Nasi Goreng Special', 350, 620, 22, 80, 22],
  ['Nasi Goreng Seafood', 350, 590, 24, 78, 19],
  ['Nasi Goreng Kampung', 330, 560, 18, 78, 19],
  ['Nasi Goreng Ayam', 350, 580, 24, 76, 18],
  ['Mie Goreng Special', 350, 600, 20, 82, 21],
  ['Mie Goreng Seafood', 350, 580, 22, 78, 19],
  ['Bakmie Ayam Jamur', 350, 480, 20, 70, 14],
  ['Bakmie Pangsit', 380, 520, 21, 72, 17],
  ['Kwetiau Goreng Seafood', 350, 590, 22, 80, 20],
  ['Kwetiau Siram Seafood', 400, 520, 23, 68, 18],
  ['Nasi Ayam Hainan', 380, 640, 30, 78, 22],
  ['Nasi Ayam Bakar', 380, 600, 30, 76, 19],
  ['Nasi Ayam Goreng Kremes', 380, 650, 28, 76, 25],
  ['Nasi Ayam Lada Hitam', 380, 610, 28, 78, 20],
  ['Nasi Ayam Saus Mentega', 380, 630, 27, 78, 22],
  ['Nasi Ayam Sambal Matah', 380, 620, 29, 77, 21],
  ['Nasi Ikan Dori Goreng Tepung', 380, 620, 24, 80, 22],
  ['Nasi Ikan Dori Saus Asam Manis', 380, 600, 24, 82, 19],
  ['Nasi Sapi Lada Hitam', 380, 640, 28, 77, 24],
  ['Nasi Sapi Rica-Rica', 380, 630, 28, 76, 23],
  ['Nasi Rawon', 420, 560, 28, 70, 18],
  ['Nasi Campur Solaria', 400, 620, 26, 78, 22],
  ['Nasi Timbel Komplit', 400, 680, 30, 78, 27],
  ['Nasi Sup Iga', 450, 600, 30, 68, 22],
  ['Soto Ayam', 350, 280, 20, 28, 9],
  ['Soto Betawi', 380, 420, 20, 24, 28],
  ['Iga Bakar Madu', 300, 560, 35, 25, 34],
  ['Spaghetti Bolognese', 300, 500, 20, 70, 15],
  ['Spaghetti Carbonara', 300, 620, 22, 66, 30],
  ['Fettuccine Chicken Mushroom', 320, 610, 24, 68, 27],
  ['Chicken Cordon Bleu', 250, 520, 28, 28, 33],
  ['Beef Steak Solaria', 300, 580, 38, 30, 33],
  ['Chicken Steak', 280, 500, 32, 28, 28],
  ['Fish & Chips', 320, 650, 26, 62, 32],
  ['Siomay Ayam', 150, 220, 11, 22, 9],
  ['Dimsum Hakau (4 pcs)', 100, 140, 7, 18, 4],
  ['Lumpia Goreng (3 pcs)', 120, 270, 6, 28, 14],
  ['Kentang Goreng Solaria', 120, 360, 4, 46, 18],
  ['Es Teler Solaria', 300, 280, 3, 48, 9],
  ['Es Campur Solaria', 300, 260, 3, 52, 6],
  ['Es Cendol Durian', 300, 340, 4, 54, 12],
  ['Es Kacang Merah', 300, 240, 4, 48, 4],
  ['Es Jeruk', 300, 110, 0, 27, 0],
  ['Es Teh Manis', 300, 90, 0, 22, 0],
  ['Es Teh Tawar', 300, 3, 0, 1, 0],
  ['Jus Alpukat', 300, 280, 4, 34, 15],
  ['Jus Mangga', 300, 180, 2, 42, 1],
];

const PH_PIZZA: Row[] = [
  ['Pizza Pepperoni Pan Medium (1 slice)', 110, 270, 11, 29, 12],
  ['Pizza Pepperoni Pan Large (1 slice)', 120, 290, 12, 31, 13],
  ['Pizza Pepperoni Stuffed Crust (1 slice)', 140, 360, 15, 36, 17],
  ['Pizza Meat Lovers Medium (1 slice)', 135, 360, 17, 30, 19],
  ['Pizza Meat Lovers Large (1 slice)', 150, 390, 18, 33, 21],
  ['Pizza Beef Pepperoni Medium (1 slice)', 110, 270, 11, 29, 12],
  ['Pizza Supreme Medium (1 slice)', 130, 300, 13, 30, 14],
  ['Pizza Super Supreme Large (1 slice)', 150, 330, 14, 34, 15],
  ['Pizza Cheese Lovers Medium (1 slice)', 120, 300, 14, 30, 14],
  ['Pizza Tuna Delight Medium (1 slice)', 120, 260, 13, 31, 9],
  ['Pizza Hawaiian Medium (1 slice)', 120, 250, 11, 33, 8],
  ['Pizza Veggie Lovers Medium (1 slice)', 120, 230, 9, 32, 7],
  ['Pizza BBQ Chicken Medium (1 slice)', 125, 270, 13, 34, 9],
  ['Pizza Smoked Beef Medium (1 slice)', 120, 270, 12, 31, 11],
  ['Pizza Chicken Mushroom Medium (1 slice)', 120, 250, 12, 32, 8],
  ['Pizza Italian Sausage Medium (1 slice)', 125, 300, 12, 30, 15],
  ['Personal Pan Pizza Pepperoni', 210, 560, 22, 66, 24],
  ['Personal Pan Pizza Supreme', 230, 590, 24, 66, 26],
  ['Personal Pan Pizza Cheese', 200, 540, 22, 66, 22],
  ['Personal Pan Pizza Tuna', 210, 500, 24, 64, 18],
  ['Pizza Mania Pepperoni (Whole)', 180, 440, 18, 50, 19],
];

const PH_SIDES: Row[] = [
  ['Spaghetti Bolognese', 300, 520, 20, 72, 16],
  ['Spaghetti Carbonara', 300, 640, 22, 68, 31],
  ['Spaghetti Meatball', 320, 580, 24, 72, 20],
  ['Macaroni & Cheese', 250, 460, 17, 52, 20],
  ['Lasagna Beef', 280, 520, 26, 44, 26],
  ['Baked Rice Chicken', 300, 560, 24, 72, 19],
  ['Baked Rice Beef', 300, 580, 24, 72, 21],
  ['Chicken Wings (4 pcs)', 120, 320, 22, 10, 21],
  ['Chicken Wings BBQ (4 pcs)', 130, 340, 21, 16, 21],
  ['Garlic Bread (2 pcs)', 80, 240, 6, 29, 11],
  ['Cheesy Garlic Bread (2 pcs)', 100, 310, 10, 30, 16],
  ['Potato Wedges', 150, 340, 5, 44, 16],
  ['Crispy Chicken Pillows (4 pcs)', 120, 330, 12, 33, 17],
  ['Cheese Sticks (4 pcs)', 100, 290, 12, 24, 15],
  ['Chicken Nuggets (6 pcs)', 100, 280, 14, 18, 17],
  ['Salad Caesar', 150, 190, 6, 10, 14],
  ['Cream Soup Mushroom', 250, 180, 4, 18, 10],
  ['Cream Soup Corn', 250, 190, 4, 22, 9],
  ['Choco Lava Cake', 90, 330, 5, 42, 16],
  ['Banana Chocolate Pizza Dessert (1 slice)', 90, 220, 4, 34, 8],
];

const PH_DRINKS: Row[] = [
  ['Pepsi Gelas', 300, 130, 0, 35, 0],
  ['Iced Lemon Tea', 300, 100, 0, 25, 0],
  ['Orange Juice', 300, 130, 1, 31, 0],
  ['Iced Chocolate', 300, 220, 5, 35, 7],
];

const OTHER_FAST_FOOD: { brand: string; cat: FoodCategory; rows: Row[] }[] = [
  {
    brand: 'Texas Chicken',
    cat: 'Proteins',
    rows: [
      ['Original Chicken (Paha Atas)', 120, 320, 22, 10, 21],
      ['Original Chicken (Dada)', 150, 380, 31, 12, 23],
      ['Spicy Chicken (Dada)', 150, 400, 31, 14, 24],
      ['Chicken Strips (3 pcs)', 110, 300, 18, 18, 17],
      ['Chicken Burger', 180, 420, 20, 40, 20],
      ['Rice Bowl Spicy Chicken', 330, 580, 26, 72, 20],
      ['Mashed Potato', 120, 120, 2, 18, 5],
      ['Biscuit', 60, 190, 3, 22, 10],
    ],
  },
  {
    brand: 'A&W',
    cat: 'Proteins',
    rows: [
      ['Papa Burger', 240, 580, 25, 45, 33],
      ['Mama Burger', 200, 450, 22, 40, 24],
      ['Teen Burger', 160, 360, 17, 33, 18],
      ['Baby Burger', 110, 250, 12, 29, 9],
      ['Chicken Burger', 180, 420, 18, 40, 22],
      ['Curly Fries', 120, 380, 4, 45, 20],
      ['Onion Rings', 120, 350, 4, 40, 19],
      ['Fried Chicken (1 pcs)', 130, 320, 22, 12, 21],
    ],
  },
  {
    brand: 'Hoka Hoka Bento',
    cat: 'Staples',
    rows: [
      ['Chicken Teriyaki Bento', 400, 640, 28, 90, 18],
      ['Beef Teriyaki Bento', 400, 660, 26, 90, 20],
      ['Chicken Katsu Bento', 400, 700, 27, 90, 25],
      ['Beef Yakiniku Bento', 400, 650, 26, 88, 20],
      ['Ebi Fry Bento', 380, 620, 22, 88, 19],
      ['Fish Katsu Bento', 380, 630, 23, 86, 21],
      ['Nasi Putih Hoka', 150, 195, 4, 43, 0.5],
      ['Chicken Karaage', 120, 300, 17, 12, 20],
    ],
  },
  {
    brand: 'Yoshinoya',
    cat: 'Staples',
    rows: [
      ['Beef Bowl Regular', 400, 650, 24, 95, 19],
      ['Beef Bowl Large', 500, 810, 30, 118, 24],
      ['Chicken Teriyaki Bowl', 400, 620, 28, 90, 16],
      ['Chicken Katsu Bowl', 400, 720, 26, 90, 28],
      ['Curry Rice Beef', 450, 700, 22, 98, 24],
    ],
  },
  {
    brand: 'Marugame Udon',
    cat: 'Staples',
    rows: [
      ['Kake Udon', 450, 380, 12, 76, 2],
      ['Niku Udon', 500, 520, 24, 80, 9],
      ['Curry Udon', 500, 560, 16, 86, 15],
      ['Tempura Ebi (1 pcs)', 40, 90, 4, 8, 5],
      ['Chicken Tempura (1 pcs)', 60, 140, 8, 9, 8],
    ],
  },
  {
    brand: 'Pizza Marzano',
    cat: 'Staples',
    rows: [
      ['Margherita (1 slice)', 120, 260, 11, 32, 9],
      ['Pepperoni (1 slice)', 130, 310, 13, 32, 14],
    ],
  },
  {
    brand: 'Domino\'s',
    cat: 'Staples',
    rows: [
      ['Pepperoni Medium (1 slice)', 110, 260, 11, 28, 11],
      ['Beef Burger Pizza Medium (1 slice)', 125, 290, 13, 30, 13],
      ['Cheese Lovers Medium (1 slice)', 115, 280, 13, 30, 12],
      ['Chicken Wings (4 pcs)', 120, 320, 22, 10, 21],
      ['Potato Wedges', 150, 340, 5, 44, 16],
    ],
  },
  {
    brand: 'Subway',
    cat: 'Staples',
    rows: [
      ['Chicken Teriyaki 6" Sub', 230, 370, 25, 56, 6],
      ['Tuna 6" Sub', 230, 450, 20, 46, 20],
      ['Meatball Marinara 6" Sub', 280, 480, 22, 58, 16],
      ['Italian BMT 6" Sub', 250, 410, 20, 47, 16],
      ['Veggie Delite 6" Sub', 180, 230, 9, 44, 2],
      ['Roast Beef 6" Sub', 240, 320, 22, 45, 5],
      ['Cookies Chocolate Chip', 45, 210, 2, 30, 10],
    ],
  },
  {
    brand: 'Carl\'s Jr',
    cat: 'Proteins',
    rows: [
      ['Western Bacon Cheeseburger', 250, 680, 33, 56, 36],
      ['Famous Star', 240, 650, 28, 52, 36],
      ['Super Star', 320, 820, 38, 58, 46],
    ],
  },
  {
    brand: 'Popeyes',
    cat: 'Proteins',
    rows: [
      ['Chicken Original (1 pcs)', 130, 340, 24, 11, 22],
      ['Chicken Spicy (1 pcs)', 130, 340, 24, 12, 22],
      ['Cajun Fries', 100, 320, 4, 40, 16],
      ['Biscuit', 60, 190, 3, 22, 10],
    ],
  },
  {
    brand: 'Pizza Hut Delivery Dessert',
    cat: 'Snacks',
    rows: [['Cinnamon Roll (2 pcs)', 90, 260, 4, 38, 10]],
  },
  {
    brand: 'Bakmi GM',
    cat: 'Staples',
    rows: [
      ['Bakmi Ayam Special', 350, 520, 22, 72, 15],
      ['Bakmi Pangsit', 380, 560, 22, 74, 18],
      ['Bakmi Yamin', 330, 480, 18, 70, 14],
      ['Nasi Goreng GM', 330, 560, 18, 78, 19],
    ],
  },
  {
    brand: 'Pepper Lunch',
    cat: 'Proteins',
    rows: [
      ['Beef Pepper Rice', 400, 680, 28, 90, 22],
      ['Chicken Pepper Rice', 400, 640, 28, 88, 19],
      ['Beef Curry Rice', 450, 720, 26, 96, 24],
    ],
  },
  {
    brand: 'Sushi Tei',
    cat: 'Proteins',
    rows: [
      ['Salmon Nigiri (1 pcs)', 35, 60, 4, 8, 1.5],
      ['Salmon Roll (6 pcs)', 150, 250, 10, 40, 5],
      ['California Roll (6 pcs)', 150, 255, 7, 38, 8],
      ['Tuna Nigiri (1 pcs)', 35, 50, 5, 8, 0.5],
      ['Ebi Tempura Roll (6 pcs)', 170, 320, 9, 44, 12],
      ['Chicken Katsu Don', 400, 700, 26, 90, 25],
      ['Beef Teriyaki Don', 400, 650, 26, 90, 19],
      ['Ramen Tonkotsu', 500, 600, 28, 70, 22],
      ['Gyoza (5 pcs)', 120, 230, 9, 24, 11],
    ],
  },
  {
    brand: 'Dunkin\'',
    cat: 'Snacks',
    rows: [
      ['Donut Glazed', 60, 240, 3, 31, 12],
      ['Donut Chocolate', 70, 260, 3, 34, 13],
      ['Donut Strawberry', 70, 260, 3, 34, 13],
      ['Donut Tiramisu', 75, 280, 3, 36, 14],
      ['Donut Oreo', 75, 290, 3, 37, 15],
      ['Munchkins (4 pcs)', 60, 220, 2, 28, 11],
      ['Croissant Cheese', 90, 300, 8, 28, 17],
    ],
  },
  {
    brand: 'J.Co',
    cat: 'Snacks',
    rows: [
      ['Donut Alcapone', 75, 290, 4, 36, 14],
      ['Donut Tiramisu', 75, 280, 3, 36, 14],
      ['Donut Glazed', 65, 250, 3, 32, 12],
      ['Donut Choco Caviar', 80, 310, 4, 38, 16],
      ['Donut Oreo Cheese', 80, 320, 4, 40, 16],
      ['Donut Avocado Dicaprio', 75, 290, 3, 36, 15],
      ['Donut Cheese Blast', 80, 310, 5, 36, 16],
    ],
  },
  {
    brand: 'Ichiban Sushi',
    cat: 'Proteins',
    rows: [
      ['Salmon Sashimi (5 pcs)', 75, 110, 15, 0, 5],
      ['Chicken Katsu Curry', 450, 720, 26, 96, 26],
      ['Tempura Udon', 500, 540, 16, 78, 15],
    ],
  },
  {
    brand: 'Burger King Kids',
    cat: 'Snacks',
    rows: [['Kids Meal Nuggets + Fries', 220, 540, 20, 56, 25]],
  },
  {
    brand: 'Wendy\'s',
    cat: 'Proteins',
    rows: [
      ['Dave\'s Single', 260, 590, 30, 40, 34],
      ['Spicy Chicken Sandwich', 220, 500, 28, 48, 20],
      ['Jr. Hamburger', 120, 270, 15, 25, 12],
    ],
  },
];

// ===================== MINUMAN =====================

const STARBUCKS: Row[] = [
  ['Caffe Americano Tall', 355, 15, 1, 3, 0],
  ['Caffe Latte Tall', 355, 190, 12, 18, 7],
  ['Caffe Latte Grande', 473, 250, 16, 24, 9],
  ['Cappuccino Tall', 355, 120, 8, 10, 6],
  ['Cappuccino Grande', 473, 140, 9, 12, 7],
  ['Caffe Mocha Tall', 355, 290, 12, 40, 9],
  ['Caffe Mocha Grande', 473, 370, 14, 50, 13],
  ['Caramel Macchiato Tall', 355, 190, 9, 27, 6],
  ['Caramel Macchiato Grande', 473, 250, 10, 35, 7],
  ['Flat White Tall', 355, 170, 10, 14, 8],
  ['White Chocolate Mocha Tall', 355, 340, 13, 46, 12],
  ['Vanilla Latte Tall', 355, 200, 11, 28, 5],
  ['Hazelnut Latte Tall', 355, 220, 11, 31, 6],
  ['Espresso Single', 30, 5, 0, 1, 0],
  ['Espresso Double', 60, 10, 1, 2, 0],
  ['Espresso Macchiato', 60, 15, 1, 2, 1],
  ['Iced Caffe Americano Tall', 355, 10, 1, 2, 0],
  ['Iced Caffe Latte Tall', 355, 130, 8, 12, 5],
  ['Iced Caffe Latte Grande', 473, 190, 12, 18, 7],
  ['Iced Caramel Macchiato Tall', 355, 190, 7, 27, 6],
  ['Iced Caffe Mocha Tall', 355, 270, 9, 40, 9],
  ['Iced White Chocolate Mocha Tall', 355, 310, 9, 46, 11],
  ['Iced Shaken Espresso Tall', 355, 100, 3, 16, 2],
  ['Cold Brew Tall', 355, 5, 0, 1, 0],
  ['Vanilla Sweet Cream Cold Brew Tall', 355, 140, 2, 21, 6],
  ['Nitro Cold Brew Tall', 355, 5, 0, 1, 0],
  ['Java Chip Frappuccino Tall', 355, 400, 5, 62, 15],
  ['Java Chip Frappuccino Grande', 473, 520, 6, 80, 20],
  ['Caramel Frappuccino Tall', 355, 340, 4, 56, 12],
  ['Caramel Frappuccino Grande', 473, 420, 5, 66, 16],
  ['Mocha Frappuccino Tall', 355, 310, 4, 52, 10],
  ['Coffee Frappuccino Tall', 355, 250, 4, 45, 5],
  ['Vanilla Cream Frappuccino Tall', 355, 340, 4, 52, 13],
  ['Strawberry Cream Frappuccino Tall', 355, 340, 3, 53, 13],
  ['Green Tea Cream Frappuccino Tall', 355, 300, 4, 48, 11],
  ['Green Tea Latte Tall', 355, 240, 11, 34, 7],
  ['Iced Green Tea Latte Tall', 355, 190, 8, 30, 5],
  ['Chai Tea Latte Tall', 355, 240, 8, 42, 4],
  ['Iced Chai Tea Latte Tall', 355, 220, 6, 40, 3],
  ['Chocolate Hot Tall', 355, 320, 12, 45, 11],
  ['Hot Chocolate Grande', 473, 400, 15, 56, 14],
  ['Iced Chocolate Tall', 355, 280, 9, 44, 8],
  ['Teavana Black Tea Hot Tall', 355, 0, 0, 0, 0],
  ['Teavana Iced Black Tea Tall', 355, 0, 0, 0, 0],
  ['Iced Passion Tango Tea Tall', 355, 45, 0, 11, 0],
  ['Iced Shaken Lemon Tea Tall', 355, 80, 0, 20, 0],
  ['Refreshers Strawberry Acai Tall', 355, 90, 0, 22, 0],
  ['Refreshers Mango Dragonfruit Tall', 355, 100, 0, 24, 0],
  ['Apple Juice Starbucks', 300, 130, 0, 31, 0],
];

const STARBUCKS_FOOD: Row[] = [
  ['Butter Croissant', 80, 270, 6, 30, 14],
  ['Chicken Mushroom Pie', 150, 380, 12, 36, 21],
  ['Blueberry Muffin', 110, 360, 5, 50, 15],
  ['Chocolate Chip Cookie', 70, 330, 4, 44, 16],
  ['Cheese Cake Slice', 110, 380, 6, 32, 26],
  ['Tuna Sandwich', 170, 380, 18, 38, 17],
];

const FORE: Row[] = [
  ['Aren Latte Regular', 300, 220, 6, 34, 7],
  ['Aren Latte Large', 450, 330, 9, 51, 10],
  ['Butterscotch Latte Regular', 300, 240, 6, 38, 8],
  ['Caramel Macchiato Regular', 300, 210, 7, 32, 7],
  ['Caffe Latte Regular', 300, 150, 8, 12, 8],
  ['Americano Regular', 300, 15, 1, 3, 0],
  ['Americano Large', 450, 20, 1, 4, 0],
  ['Cappuccino Regular', 300, 130, 7, 11, 6],
  ['Flat White Regular', 300, 150, 8, 11, 8],
  ['Mocha Regular', 300, 250, 8, 36, 9],
  ['Coffee Beer Regular', 300, 120, 2, 24, 2],
  ['Pandan Latte Regular', 300, 200, 6, 30, 7],
  ['Hazelnut Latte Regular', 300, 190, 7, 28, 6],
  ['Matcha Latte Regular', 300, 190, 8, 26, 6],
  ['Matcha Aren Regular', 300, 210, 7, 32, 6],
  ['Chocolate Regular', 300, 260, 8, 40, 8],
  ['Lychee Tea Regular', 300, 110, 0, 27, 0],
  ['Peach Tea Regular', 300, 100, 0, 25, 0],
  ['Lemon Tea Regular', 300, 90, 0, 22, 0],
  ['Strawberry Yakult Regular', 300, 180, 2, 38, 1],
  ['Mango Yakult Regular', 300, 190, 2, 40, 1],
  ['Creme Brulee Latte Regular', 300, 260, 6, 40, 9],
  ['Cold Brew Regular', 300, 10, 1, 2, 0],
  ['Coffee Cloud Regular', 300, 180, 5, 28, 6],
  ['Croissant Butter Fore', 80, 270, 6, 30, 14],
  ['Almond Croissant Fore', 100, 380, 8, 36, 22],
  ['Chicken Pie Fore', 130, 340, 10, 30, 20],
];

const KOPKEN: Row[] = [
  ['Kopi Susu Tetangga Reguler', 250, 190, 4, 30, 6],
  ['Kopi Susu Tetangga Large', 350, 270, 6, 42, 9],
  ['Kopi Susu Tetangga Less Sugar', 250, 130, 4, 18, 5],
  ['Kopi Susu Tetangga Zero Sugar', 250, 90, 4, 8, 5],
  ['Kopi Susu Kenangan Mantan Reguler', 250, 210, 5, 33, 7],
  ['Kopi Susu Kenangan Hati Reguler', 250, 200, 4, 32, 6],
  ['Kopi Nako Reguler', 250, 180, 5, 28, 6],
  ['Kopi Susu Aren Reguler', 250, 190, 4, 30, 6],
  ['Caramel Latte Reguler', 250, 200, 5, 31, 6],
  ['Americano Reguler', 250, 10, 1, 2, 0],
  ['Latte Reguler', 250, 130, 7, 10, 7],
  ['Cappuccino Reguler', 250, 110, 6, 9, 6],
  ['Matcha Latte Reguler', 250, 180, 6, 28, 5],
  ['Chocolate Reguler', 250, 230, 7, 37, 7],
  ['Teh Tarik Reguler', 250, 160, 3, 28, 4],
  ['Thai Tea Reguler', 250, 150, 2, 27, 4],
  ['Es Teh Lemon Reguler', 250, 80, 0, 20, 0],
  ['Es Teh Lychee Reguler', 250, 90, 0, 22, 0],
  ['Es Teh Peach Reguler', 250, 90, 0, 22, 0],
  ['Es Teh Manis Reguler', 250, 90, 0, 22, 0],
  ['Es Kopi Pelangi Reguler', 250, 220, 4, 36, 7],
  ['Lychee Yakult Reguler', 250, 150, 2, 32, 1],
  ['Kenangan Signature Latte', 250, 190, 5, 30, 6],
  ['Tiramisu Latte Reguler', 250, 210, 5, 33, 7],
  ['Butterscotch Latte Reguler', 250, 220, 5, 35, 7],
  ['Red Velvet Latte Reguler', 250, 230, 5, 37, 7],
  ['Taro Latte Reguler', 250, 220, 4, 38, 6],
  ['Cokelat Hazelnut Reguler', 250, 240, 7, 38, 8],
];

const KENANGAN_FOOD: Row[] = [
  ['Roti Sobek Coklat', 90, 260, 6, 38, 9],
  ['Croissant Cheese', 90, 300, 8, 28, 17],
  ['Pastry Chicken Mayo', 100, 270, 9, 28, 13],
];

const CHATIME: Row[] = [
  ['Milk Tea Pearl (Regular)', 500, 360, 4, 58, 11],
  ['Milk Tea Pearl (Large)', 700, 480, 5, 78, 15],
  ['Milk Tea 3J (Regular)', 500, 390, 4, 64, 11],
  ['Milk Tea 3J (Large)', 700, 520, 5, 85, 15],
  ['Milk Tea Regular (no topping)', 500, 250, 4, 38, 9],
  ['Black Milk Tea with Pearl (Regular)', 500, 340, 4, 56, 10],
  ['Earl Grey Milk Tea (Regular)', 500, 260, 4, 40, 9],
  ['Oolong Milk Tea (Regular)', 500, 250, 4, 38, 9],
  ['Jasmine Milk Tea (Regular)', 500, 250, 4, 38, 9],
  ['Taro Milk Tea (Regular)', 500, 340, 4, 56, 11],
  ['Taro Milk Tea with Pearl (Regular)', 500, 420, 4, 72, 11],
  ['Brown Sugar Pearl Milk Tea (Regular)', 500, 420, 4, 72, 12],
  ['Brown Sugar Milk Tea (Regular)', 500, 380, 4, 62, 11],
  ['Roasted Milk Tea (Regular)', 500, 270, 4, 42, 9],
  ['Hokkaido Milk Tea (Regular)', 500, 310, 5, 48, 11],
  ['Wintermelon Milk Tea (Regular)', 500, 280, 4, 46, 8],
  ['Matcha Milk Tea (Regular)', 500, 290, 5, 44, 9],
  ['Thai Milk Tea (Regular)', 500, 320, 4, 50, 10],
  ['Ovaltine Milk Tea (Regular)', 500, 330, 5, 52, 10],
  ['Chocolate Milk Tea (Regular)', 500, 340, 6, 52, 11],
  ['Mango Green Tea (Regular)', 500, 190, 1, 46, 0],
  ['Passion Fruit Green Tea (Regular)', 500, 170, 0, 42, 0],
  ['Lemon Green Tea (Regular)', 500, 150, 0, 38, 0],
  ['Honey Green Tea (Regular)', 500, 160, 0, 40, 0],
  ['Peach Green Tea (Regular)', 500, 160, 0, 40, 0],
  ['Lychee Green Tea (Regular)', 500, 170, 0, 42, 0],
  ['Strawberry Green Tea (Regular)', 500, 170, 0, 42, 0],
  ['Wintermelon Tea (Regular)', 500, 190, 0, 47, 0],
  ['Green Tea (Regular)', 500, 120, 0, 30, 0],
  ['Black Tea (Regular)', 500, 110, 0, 28, 0],
  ['Oolong Tea (Regular)', 500, 110, 0, 28, 0],
  ['Chatime Fruit Tea Mix (Regular)', 500, 180, 0, 44, 0],
  ['Chocolate Smoothie (Regular)', 500, 380, 6, 66, 10],
  ['Strawberry Smoothie (Regular)', 500, 300, 2, 66, 3],
  ['Mango Smoothie (Regular)', 500, 320, 3, 68, 4],
  ['Taro Smoothie (Regular)', 500, 360, 4, 68, 8],
  ['Oreo Smoothie (Regular)', 500, 420, 6, 70, 12],
  ['Coffee Milk Tea (Regular)', 500, 280, 5, 44, 9],
  ['Pudding Milk Tea (Regular)', 500, 340, 5, 54, 11],
  ['Chatime Signature Series (Regular)', 500, 360, 5, 58, 11],
  ['Extra Topping Pearl', 60, 110, 0, 27, 0],
  ['Extra Topping Pudding', 60, 80, 2, 14, 2],
  ['Extra Topping Grass Jelly', 60, 40, 0, 10, 0],
  ['Extra Topping Aloe Vera', 60, 40, 0, 10, 0],
  ['Extra Topping Cheese Foam', 60, 120, 3, 5, 10],
];

const KOI: Row[] = [
  ['Golden Bubble Milk Tea Regular', 500, 380, 4, 62, 11],
  ['Brown Sugar Boba Milk Regular', 500, 420, 6, 68, 12],
  ['Jasmine Green Milk Tea Regular', 500, 260, 4, 40, 9],
  ['Oolong Milk Tea Regular', 500, 260, 4, 40, 9],
  ['Cheese Foam Green Tea Regular', 500, 280, 4, 38, 11],
  ['Taro Milk Tea Regular', 500, 340, 4, 56, 11],
  ['Matcha Latte Regular', 500, 300, 6, 46, 9],
  ['Mango Smoothie Regular', 500, 300, 3, 65, 3],
];

const GONG_CHA: Row[] = [
  ['Milk Foam Black Tea Regular', 500, 320, 5, 42, 13],
  ['Milk Foam Green Tea Regular', 500, 310, 5, 40, 13],
  ['Pearl Milk Tea Regular', 500, 360, 4, 58, 11],
  ['Brown Sugar Pearl Milk Regular', 500, 410, 5, 68, 12],
  ['Taro Milk Tea Regular', 500, 340, 4, 56, 11],
  ['Oreo Milk Tea Regular', 500, 380, 5, 60, 12],
  ['Mango Yakult Regular', 500, 250, 2, 56, 1],
];

const KULO: Row[] = [
  ['Brown Sugar Boba Milk', 500, 420, 6, 70, 12],
  ['Boba Milk Tea', 500, 360, 4, 58, 11],
  ['Cheese Milk Tea', 500, 340, 6, 46, 14],
  ['Matcha Milk', 500, 300, 6, 46, 9],
];

const JANJI_JIWA: Row[] = [
  ['Kopi Susu Gula Aren', 250, 190, 4, 30, 6],
  ['Kopi Susu Regal', 250, 200, 4, 32, 6],
  ['Americano', 250, 10, 1, 2, 0],
  ['Latte', 250, 140, 7, 11, 7],
  ['Es Kopi Susu Pandan', 250, 200, 4, 32, 6],
  ['Es Kopi Susu Aren Regal', 250, 210, 4, 34, 7],
  ['Cappuccino', 250, 120, 6, 10, 6],
  ['Matcha Latte', 250, 180, 6, 28, 5],
  ['Es Teh Manis', 250, 90, 0, 22, 0],
  ['Chocolate', 250, 230, 7, 37, 7],
];

const TOMORO: Row[] = [
  ['Tomoro Latte Regular', 300, 160, 8, 14, 8],
  ['Americano Regular', 300, 15, 1, 3, 0],
  ['Aren Latte Regular', 300, 220, 6, 34, 7],
  ['Coconut Latte Regular', 300, 210, 4, 28, 9],
  ['Cappuccino Regular', 300, 130, 7, 11, 6],
  ['Matcha Latte Regular', 300, 190, 7, 28, 6],
];

const COFFEE_CHAINS: { brand: string; rows: Row[] }[] = [
  {
    brand: 'Excelso',
    rows: [
      ['Cappuccino', 250, 130, 7, 11, 6],
      ['Caffe Latte', 300, 170, 9, 14, 8],
      ['Americano', 250, 10, 1, 2, 0],
      ['Caramel Macchiato', 300, 220, 8, 32, 7],
      ['Es Kopi Susu', 300, 200, 5, 30, 7],
      ['Mocha', 300, 260, 9, 38, 9],
    ],
  },
  {
    brand: 'Coffee Bean',
    rows: [
      ['Ice Blended Vanilla', 473, 380, 5, 62, 12],
      ['Ice Blended Mocha', 473, 400, 6, 64, 14],
      ['Caffe Latte', 355, 190, 11, 18, 7],
      ['Cappuccino', 355, 140, 8, 12, 7],
      ['Americano', 355, 10, 1, 2, 0],
    ],
  },
  {
    brand: 'Kopi Tuku',
    rows: [
      ['Es Kopi Susu Tetangga', 250, 190, 4, 30, 6],
      ['Es Kopi Susu Aren', 250, 190, 4, 30, 6],
      ['Americano', 250, 10, 1, 2, 0],
    ],
  },
  {
    brand: 'Point Coffee',
    rows: [
      ['Kopi Susu Gula Aren', 250, 190, 4, 30, 6],
      ['Americano', 250, 10, 1, 2, 0],
      ['Caffe Latte', 250, 140, 7, 11, 7],
    ],
  },
  {
    brand: 'Maxx Coffee',
    rows: [
      ['Cappuccino', 250, 130, 7, 11, 6],
      ['Caffe Latte', 300, 170, 9, 14, 8],
      ['Es Kopi Susu', 300, 200, 5, 30, 7],
    ],
  },
  {
    brand: 'Hangry',
    rows: [['Es Kopi Susu', 250, 190, 4, 30, 6]],
  },
  {
    brand: 'Cafe Amazon',
    rows: [
      ['Latte', 300, 160, 8, 13, 8],
      ['Cappuccino', 250, 130, 7, 11, 6],
      ['Mocha', 300, 260, 9, 38, 9],
    ],
  },
];

const OTHER_DRINKS: { brand: string; rows: Row[] }[] = [
  {
    brand: 'Es Teh Indonesia',
    rows: [
      ['Es Teh Original', 300, 90, 0, 22, 0],
      ['Es Teh Lemon', 300, 100, 0, 25, 0],
      ['Es Teh Solo', 300, 100, 0, 25, 0],
      ['Es Teh Lychee', 300, 110, 0, 27, 0],
      ['Chocolate Milk', 300, 240, 7, 38, 7],
    ],
  },
  {
    brand: 'Mixue',
    rows: [
      ['Es Krim Cone', 90, 150, 3, 24, 5],
      ['Boba Milk Tea', 500, 340, 4, 56, 10],
      ['Lemon Tea', 500, 130, 0, 32, 0],
      ['Strawberry Sundae', 150, 230, 3, 38, 7],
      ['Oreo Sundae', 150, 260, 4, 40, 9],
      ['Fresh Orange Juice', 400, 150, 2, 36, 0],
      ['Mango Smoothie', 500, 320, 3, 68, 4],
    ],
  },
  {
    brand: 'Haus!',
    rows: [
      ['Thai Tea', 500, 230, 3, 40, 7],
      ['Boba Series', 500, 380, 4, 62, 11],
      ['Lychee Tea', 500, 150, 0, 37, 0],
      ['Red Velvet', 500, 340, 5, 56, 10],
      ['Oreo Ice Blend', 500, 400, 6, 66, 12],
      ['Cheese Cake Ice Blend', 500, 420, 6, 70, 13],
    ],
  },
  {
    brand: 'Dum Dum',
    rows: [['Thai Tea', 400, 200, 3, 36, 6]],
  },
  {
    brand: 'Pop Ice',
    rows: [['Chocolate Blend', 300, 220, 3, 40, 6], ['Mango Blend', 300, 200, 2, 40, 4]],
  },
  {
    brand: 'Pocari / Isotonic',
    rows: [
      ['Pocari Sweat 500ml', 500, 130, 0, 32, 0],
      ['Mizone 500ml', 500, 100, 0, 25, 0],
    ],
  },
  {
    brand: 'Teh Botol Sosro',
    rows: [
      ['Original 350ml', 350, 130, 0, 33, 0],
      ['Less Sugar 350ml', 350, 70, 0, 17, 0],
    ],
  },
  {
    brand: 'Ultra Milk',
    rows: [
      ['Full Cream 250ml', 250, 150, 8, 12, 8],
      ['Chocolate 250ml', 250, 180, 7, 27, 5],
      ['Strawberry 250ml', 250, 170, 6, 27, 4],
    ],
  },
  {
    brand: 'Cimory',
    rows: [
      ['Yogurt Drink 240ml', 240, 160, 5, 28, 3],
      ['Fresh Milk 250ml', 250, 160, 8, 12, 9],
    ],
  },
  {
    brand: 'Susu Kental Manis',
    rows: [['Susu Kental Manis (1 sdm)', 20, 65, 1.5, 11, 1.5]],
  },
  {
    brand: 'Coca-Cola',
    rows: [
      ['Coca-Cola Can 330ml', 330, 140, 0, 35, 0],
      ['Sprite Can 330ml', 330, 130, 0, 33, 0],
      ['Fanta Can 330ml', 330, 140, 0, 36, 0],
    ],
  },
];

// ===================== BUILD =====================

export const BRAND_FOOD_DATABASE: FoodItem[] = [
  ...build('KFC', 'Proteins', KFC_MAINS),
  ...build('KFC', 'Snacks', KFC_SIDES),
  ...build('KFC', 'Dairy & Drinks', KFC_DRINKS),
  ...build('McD', 'Proteins', MCD_BURGERS),
  ...build('McD', 'Snacks', MCD_CHICKEN_SIDES),
  ...build('McD', 'Dairy & Drinks', MCD_DRINKS),
  ...build('Burger King', 'Proteins', BK_ROWS),
  ...build('Burger King', 'Dairy & Drinks', BK_DRINKS),
  ...build('Solaria', 'Staples', SOLARIA_ROWS),
  ...build('Pizza Hut', 'Staples', PH_PIZZA),
  ...build('Pizza Hut', 'Snacks', PH_SIDES),
  ...build('Pizza Hut', 'Dairy & Drinks', PH_DRINKS),
  ...OTHER_FAST_FOOD.flatMap((g) => build(g.brand, g.cat, g.rows)),
  ...build('Starbucks', 'Dairy & Drinks', STARBUCKS),
  ...build('Starbucks', 'Snacks', STARBUCKS_FOOD),
  ...build('Fore', 'Dairy & Drinks', FORE),
  ...build('Kopi Kenangan', 'Dairy & Drinks', KOPKEN),
  ...build('Kopi Kenangan', 'Snacks', KENANGAN_FOOD),
  ...build('Chatime', 'Dairy & Drinks', CHATIME),
  ...build('Koi', 'Dairy & Drinks', KOI),
  ...build('Gong Cha', 'Dairy & Drinks', GONG_CHA),
  ...build('Kulo', 'Dairy & Drinks', KULO),
  ...build('Janji Jiwa', 'Dairy & Drinks', JANJI_JIWA),
  ...build('Tomoro', 'Dairy & Drinks', TOMORO),
  ...COFFEE_CHAINS.flatMap((g) => build(g.brand, 'Dairy & Drinks', g.rows)),
  ...OTHER_DRINKS.flatMap((g) => build(g.brand, 'Dairy & Drinks', g.rows)),
];
