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

function isDrinkName(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n.startsWith('es ') ||
    n.startsWith('jus ') ||
    n.includes('milkshake') ||
    n.includes('float') ||
    n.includes('kopi') ||
    n.includes('teh') ||
    n.includes('smoothie')
  );
}

function build(brand: string, category: FoodCategory, rows: Row[]): FoodItem[] {
  return rows.map(([name, grams, kcal, protein, carbs, fat]) => {
    const f = 100 / grams;
    const itemIsDrink = category === 'Dairy & Drinks' || isDrinkName(name);
    const itemCategory: FoodCategory = itemIsDrink ? 'Dairy & Drinks' : category;
    return {
      id: `brand_${slug(brand)}_${slug(name)}`,
      name: `${brand} ${name}`,
      indonesianName: `${brand} ${name}`,
      category: itemCategory,
      calories: Math.round(kcal * f),
      protein: round1(protein * f),
      carbs: round1(carbs * f),
      fat: round1(fat * f),
      defaultServingText: itemIsDrink ? `1 Gelas (${grams}ml)` : `1 Porsi (${grams}g)`,
      defaultServingGrams: grams,
    };
  });
}

// ===================== FAST FOOD =====================

const KFC_MAINS: Row[] = [
  // Ayam
  ['Original Recipe Ayam (Paha Atas)', 120, 320, 22, 10, 21],
  ['Original Recipe Ayam (Paha Bawah)', 90, 220, 17, 7, 14],
  ['Original Recipe Ayam (Dada)', 150, 390, 32, 13, 24],
  ['Original Recipe Ayam (Sayap)', 60, 180, 11, 7, 12],
  ['Crispy Ayam (Paha Atas)', 130, 360, 22, 14, 24],
  ['Crispy Ayam (Paha Bawah)', 95, 240, 17, 8, 15],
  ['Crispy Ayam (Dada)', 160, 420, 31, 16, 26],
  ['Crispy Ayam (Sayap)', 65, 190, 12, 8, 13],
  ['Hot & Spicy Ayam (Paha Atas)', 120, 330, 21, 11, 22],
  ['Hot & Spicy Ayam (Dada)', 150, 380, 31, 13, 23],
  // Hot Wings & Strips
  ['Hot Wings (3 pcs)', 120, 330, 20, 14, 21],
  ['Hot Wings (6 pcs)', 240, 660, 40, 28, 42],
  ['Chicken Strips (3 pcs)', 110, 300, 18, 18, 17],
  ['Chicken Strips (5 pcs)', 180, 490, 29, 29, 28],
  ['Chicken Popcorn Regular', 75, 200, 11, 13, 12],
  ['Chicken Popcorn Large', 135, 360, 20, 23, 21],
  // Burger & Twister
  ['Zinger Burger', 190, 470, 22, 40, 24],
  ['Zinger Stacker (Double Beef)', 250, 620, 34, 48, 32],
  ['Twister', 220, 460, 18, 45, 22],
  ['Longer Burger', 150, 360, 17, 33, 18],
  ['Colonel Burger', 170, 400, 20, 35, 20],
  ['OR Burger', 160, 380, 18, 34, 20],
  // Rice Bowl & Paket
  ['Rice Bowl Chicken Teriyaki', 330, 560, 26, 72, 18],
  ['Rice Bowl Chicken Spicy BBQ', 330, 570, 25, 74, 19],
  ['Rice Bowl Chicken Butter', 330, 580, 25, 71, 21],
  ['Rice Bowl Chicken Gulai Padang', 330, 600, 24, 73, 23],
  ['Rice Bowl Chicken Lada Hitam', 330, 575, 25, 72, 20],
  ['Rice Bowl Chicken Saus Mentega', 330, 590, 25, 71, 22],
  ['Oriental Bento Nasi Ayam', 380, 640, 30, 80, 22],
  ['Oriental Bento Nasi Ayam Teriyaki', 380, 620, 29, 82, 20],
  ['Snack Plate (Ayam + Nasi)', 280, 520, 24, 62, 20],
  ['Paket Nasi Ayam Original', 330, 560, 27, 68, 20],
  ['Paket Nasi Ayam Crispy', 340, 600, 26, 70, 24],
  ['Paket Nasi Ayam Hot & Spicy', 330, 560, 27, 68, 20],
  ['Paket Hemat 1 (Ayam + Nasi + Minum)', 450, 680, 28, 90, 22],
  ['Paket Hemat 2 (Ayam + Fries + Minum)', 400, 740, 26, 85, 32],
  ['Fiesta Bucket 4pcs Ayam', 480, 1280, 88, 40, 84],
  ['Fiesta Bucket 6pcs Ayam', 720, 1920, 132, 60, 126],
  // Other mains
  ['Spaghetti Bolognese', 250, 420, 14, 60, 14],
  ['McSpaghetti Saus Tomat Ayam KFC', 250, 410, 15, 62, 12],
  ['Bubur Ayam KFC', 280, 240, 10, 38, 6],
  ['Egg Tart', 70, 190, 3, 20, 11],
  ['Cheese Tart', 70, 200, 4, 19, 12],
];

const KFC_SIDES: Row[] = [
  ['French Fries Regular', 100, 300, 4, 38, 15],
  ['French Fries Large', 150, 450, 6, 57, 22],
  ['Mashed Potato', 120, 120, 2, 18, 5],
  ['Mashed Potato + Gravy', 140, 155, 2, 22, 7],
  ['Coleslaw Regular', 100, 150, 1, 11, 11],
  ['Coleslaw Large', 180, 270, 2, 20, 20],
  ['Corn on the Cob', 100, 90, 3, 20, 1],
  ['Nasi Putih KFC', 150, 195, 4, 43, 0.5],
  ['Perkedel Kentang', 50, 90, 2, 11, 4],
  ['Dinner Roll', 40, 120, 3, 22, 2],
  ['Mac & Cheese KFC', 140, 300, 10, 36, 12],
];



const KFC_DRINKS: Row[] = [
  ['Pepsi Regular', 250, 100, 0, 28, 0],
  ['Pepsi Medium', 360, 150, 0, 41, 0],
  ['Pepsi Large', 450, 190, 0, 51, 0],
  ['Lipton Iced Tea Medium', 360, 110, 0, 28, 0],
  ['Float Pepsi', 300, 240, 3, 45, 5],
  ['Float Taro', 300, 250, 3, 46, 5],
  ['Float Milo', 300, 260, 5, 46, 6],
  ['Es Krim Sundae Coklat', 150, 230, 4, 36, 8],
  ['Es Krim Sundae Karamel', 150, 240, 4, 38, 8],
  ['Es Krim Cone', 90, 140, 3, 22, 5],
  ['Es Krim Twister Cone', 100, 160, 3, 24, 6],
];

const MCD_BURGERS: Row[] = [
  // Daging Sapi
  ['Big Mac', 215, 550, 25, 45, 30],
  ['Double Big Mac', 295, 760, 42, 46, 43],
  ['Triple Cheeseburger', 255, 680, 41, 43, 35],
  ['Double Cheeseburger', 175, 440, 26, 34, 24],
  ['Cheeseburger Deluxe', 155, 430, 22, 40, 22],
  ['Cheeseburger', 119, 300, 15, 33, 12],
  ['Beef Burger Deluxe', 190, 480, 22, 42, 25],
  ['Beef Burger', 105, 260, 13, 31, 10],
  // Ayam
  ['McSpicy Chicken Burger', 190, 460, 21, 40, 23],
  ['McChicken', 150, 400, 14, 40, 21],
  // Ikan
  ['Filet-O-Fish', 140, 340, 15, 38, 14],
  // Breakfast
  ['Chicken Muffin', 120, 300, 17, 30, 12],
  ['Chicken Muffin with Egg', 140, 370, 22, 31, 18],
  ['Sausage McMuffin', 120, 370, 14, 28, 22],
  ['Sausage McMuffin with Egg', 165, 450, 21, 30, 27],
  ['Sausage Wrap', 100, 310, 12, 28, 17],
  ['Big Breakfast', 250, 620, 28, 50, 38],
  ['Hotcakes 3 pcs', 170, 340, 8, 58, 7],
  ['Hotcakes 2 pcs', 125, 250, 6, 44, 6],
  ['Hashbrown', 55, 150, 2, 15, 9],
  ['Nasi Uduk McD', 230, 290, 9, 38, 10],
  ['Bubur Ayam McD', 280, 230, 10, 36, 6],
];

const MCD_CHICKEN_SIDES: Row[] = [
  // Ayam Krispy
  ['Ayam Krispy McD Dada', 140, 310, 24, 10, 20],
  ['Ayam Krispy McD Paha Atas', 120, 270, 19, 9, 17],
  ['Ayam Krispy McD Paha Bawah', 90, 200, 14, 7, 13],
  ['Ayam Krispy McD Sayap', 65, 170, 11, 6, 11],
  ['Ayam Spicy McD Dada', 140, 320, 24, 10, 21],
  ['Ayam Spicy McD Paha', 120, 280, 19, 9, 18],
  ['Ayam McD Sambal Matah Spesial Krispy + Nasi', 340, 620, 28, 72, 22],
  ['Panas 1 Sambal Matah Krispy + Nasi', 340, 610, 27, 71, 22],
  ['PaNas 1 Ayam + Nasi + Minuman', 420, 680, 28, 85, 22],
  ['PaNas 2 Ayam + Nasi + Minuman', 550, 960, 48, 104, 36],
  // Wings
  ['Korean Soy Garlic Wings 6 pcs', 180, 450, 28, 24, 27],
  ['Korean Soy Garlic Wings 3 pcs', 90, 225, 14, 12, 14],
  ['McWings 2 pcs', 100, 260, 15, 12, 17],
  ['McWings 4 pcs', 200, 520, 30, 24, 34],
  // Nuggets & Strips
  ['Chicken McNuggets 6 pcs', 100, 280, 15, 17, 18],
  ['Chicken McNuggets 9 pcs', 150, 420, 22, 25, 26],
  ['Chicken McNuggets 20 pcs', 340, 940, 50, 57, 57],
  // Pasta
  ['McSpaghetti Ayam Krispy', 250, 500, 20, 66, 18],
  ['McSpaghetti Ayam Spicy', 250, 510, 20, 66, 19],
  // Sides
  ['Fries Regular', 100, 300, 4, 38, 15],
  ['Fries Medium', 120, 360, 5, 46, 18],
  ['Fries Large', 150, 450, 6, 57, 22],
  ['Nasi Putih McD', 150, 195, 4, 43, 0.5],
  ['Apple Pie', 80, 230, 2, 29, 12],
  // Dessert
  ['McFlurry Oreo Regular', 200, 340, 7, 50, 12],
  ['McFlurry Oreo Mini', 115, 195, 4, 28, 7],
  ['McFlurry Choco Regular', 200, 350, 7, 52, 12],
  ['Sundae Strawberry', 150, 220, 4, 38, 6],
  ['Sundae Chocolate', 150, 240, 4, 40, 7],
  ['Cone Vanilla', 90, 150, 4, 24, 4],
  ['Happy Meal (Ayam + Fries + Minuman)', 330, 560, 22, 68, 20],
];

const MCD_DRINKS: Row[] = [
  ['Coca-Cola Small', 250, 100, 0, 28, 0],
  ['Coca-Cola Medium', 360, 150, 0, 40, 0],
  ['Coca-Cola Large', 500, 210, 0, 56, 0],
  ['Sprite Medium', 360, 140, 0, 36, 0],
  ['Fanta Strawberry Medium', 360, 150, 0, 40, 0],
  ['Iced Lemon Tea Medium', 360, 100, 0, 25, 0],
  ['Milo Ice', 300, 180, 6, 28, 5],
  ['Fruit Tea Lychee', 360, 120, 0, 30, 0],
  // McCafe
  ['McCafe Latte', 250, 140, 8, 12, 7],
  ['McCafe Cappuccino', 250, 130, 7, 11, 6],
  ['McCafe Americano', 250, 10, 1, 2, 0],
  ['McCafe Caramel Frappé', 400, 380, 5, 58, 15],
  ['McCafe Mocha Frappé', 400, 420, 6, 62, 17],
  ['McCafe Vanilla Frappé', 400, 360, 5, 55, 14],
  ['McCafe Chocolate Milkshake', 400, 620, 12, 92, 21],
  ['McCafe Strawberry Milkshake', 400, 570, 12, 86, 18],
  ['McCafe Vanilla Milkshake', 400, 570, 12, 85, 18],
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
  // ---- NASI GORENG ----
  ['Nasi Goreng Biasa', 330, 540, 16, 76, 18],
  ['Nasi Goreng Special Solaria', 350, 620, 22, 80, 22],
  ['Nasi Goreng Seafood', 350, 590, 24, 78, 19],
  ['Nasi Goreng Ayam', 350, 580, 24, 76, 18],
  ['Nasi Goreng Sapi', 350, 620, 25, 78, 22],
  ['Nasi Goreng Sapi Cabe Ijo', 350, 610, 23, 78, 21],
  ['Nasi Goreng Kambing', 350, 640, 26, 76, 24],
  ['Nasi Goreng Tom Yum', 350, 590, 20, 78, 20],
  ['Nasi Goreng Kampung', 330, 560, 18, 78, 19],
  ['Nasi Goreng Pete', 330, 560, 18, 76, 19],
  ['Nasi Goreng Sosis', 340, 570, 19, 78, 20],
  ['Nasi Goreng Bakso', 340, 575, 20, 78, 20],
  ['Nasi Goreng Teri Medan', 330, 550, 21, 76, 18],
  ['Nasi Goreng Italian', 340, 580, 20, 76, 21],
  ['Nasi Goreng Modern (Smoked Beef & Cheese)', 350, 630, 23, 75, 25],

  // ---- MIE, KWETIAU & BIHUN ----
  ['Mie Goreng Special', 350, 600, 20, 82, 21],
  ['Mie Goreng Seafood', 350, 580, 22, 78, 19],
  ['Mie Goreng Ayam', 330, 560, 18, 78, 18],
  ['Mie Goreng Sapi', 350, 590, 22, 78, 20],
  ['Mie Kuah Ayam', 400, 420, 18, 62, 12],
  ['Mie Kuah Seafood', 400, 440, 20, 62, 13],
  ['Bakmie Ayam Solaria', 350, 480, 20, 70, 14],
  ['Bakmie Ayam Bakso', 380, 530, 23, 72, 16],
  ['Bakmie Ayam Pangsit Goreng', 380, 540, 21, 74, 18],
  ['Bakmie Ayam Cah Jamur', 350, 490, 20, 68, 15],
  ['Lo Mie Solaria', 420, 540, 22, 75, 17],
  ['Kwetiau Goreng Special', 350, 610, 22, 82, 21],
  ['Kwetiau Goreng Seafood', 350, 590, 22, 80, 20],
  ['Kwetiau Goreng Sapi', 350, 600, 24, 80, 21],
  ['Kwetiau Goreng Ayam', 350, 570, 20, 80, 18],
  ['Kwetiau Siram Seafood', 420, 520, 23, 68, 18],
  ['Kwetiau Siram Sapi', 420, 540, 26, 68, 20],
  ['Kwetiau Siram Ayam', 420, 500, 22, 68, 16],
  ['Bihun Goreng Special', 340, 550, 20, 80, 17],
  ['Bihun Goreng Seafood', 330, 540, 20, 78, 17],
  ['Bihun Goreng Ayam', 330, 530, 18, 78, 16],
  ['Bihun Siram Seafood', 400, 480, 21, 66, 15],

  // ---- EXPRESS BOWL ----
  ['Express Bowl Ayam Saus Mentega', 300, 520, 26, 64, 20],
  ['Express Bowl Ayam Rica-Rica', 300, 510, 25, 64, 19],
  ['Express Bowl Ayam Teriyaki', 300, 500, 25, 68, 17],
  ['Express Bowl Ayam Asam Manis', 300, 515, 24, 66, 18],
  ['Express Bowl Fillet Ikan Saus Mentega', 300, 500, 22, 66, 17],
  ['Express Bowl Fillet Ikan Rica-Rica', 300, 490, 22, 65, 16],
  ['Express Bowl Fillet Ikan Asam Manis', 300, 495, 21, 67, 16],
  ['Express Bowl Mix (Ayam & Udang Saus Mentega)', 310, 530, 25, 65, 19],

  // ---- PAKET NASI AYAM ----
  ['Chicken Cordon Bleu + Nasi / Fries', 350, 680, 32, 64, 34],
  ['Chicken Mozzarella + Nasi / Fries', 350, 690, 33, 64, 35],
  ['Chicken Steak Solaria + Nasi / Fries', 340, 580, 34, 52, 26],
  ['Nasi Ayam Goreng Mentega', 380, 630, 27, 78, 22],
  ['Nasi Ayam Goreng Tepung', 380, 640, 28, 76, 24],
  ['Nasi Ayam Rica-Rica', 380, 610, 27, 76, 21],
  ['Nasi Ayam Saus Asam Manis', 380, 620, 26, 80, 20],
  ['Nasi Ayam Saus Tiram', 380, 600, 28, 76, 19],
  ['Nasi Ayam Lada Hitam', 380, 610, 28, 78, 20],
  ['Nasi Ayam Cah Jamur', 380, 570, 27, 74, 18],
  ['Nasi Ayam Cah Kembang Kol', 380, 560, 26, 74, 17],
  ['Nasi Ayam Hainan', 380, 640, 30, 78, 22],
  ['Nasi Ayam Bakar Kecap', 380, 600, 30, 76, 19],
  ['Nasi Ayam Goreng Kremes', 380, 650, 28, 76, 25],
  ['Nasi Ayam Sambal Terasi / Matah', 380, 620, 29, 77, 21],

  // ---- PAKET NASI SAPI & IGA ----
  ['Beef Steak Solaria + Nasi / Fries', 350, 660, 38, 54, 32],
  ['Nasi Bistik Sapi Solaria', 380, 650, 30, 76, 24],
  ['Nasi Sapi Lada Hitam', 380, 640, 28, 77, 24],
  ['Nasi Sapi Rica-Rica', 380, 630, 28, 76, 23],
  ['Nasi Sapi Cabe Ijo', 380, 620, 26, 76, 22],
  ['Nasi Sapi Saus Tiram', 380, 630, 28, 76, 22],
  ['Nasi Sapi Cah Cabai', 380, 620, 27, 75, 22],
  ['Iga Bakar Madu + Nasi', 420, 720, 38, 75, 30],

  // ---- PAKET NASI SEAFOOD ----
  ['Fish & Chips Solaria', 350, 680, 26, 68, 33],
  ['Nasi Ikan Dori Goreng Tepung', 380, 620, 24, 80, 22],
  ['Nasi Ikan Dori Saus Asam Manis', 380, 600, 24, 82, 19],
  ['Nasi Ikan Dori Saus Mentega', 380, 610, 24, 80, 21],
  ['Nasi Ikan Dori Lada Hitam', 380, 610, 24, 80, 21],
  ['Nasi Udang Goreng Tepung', 380, 620, 22, 82, 22],
  ['Nasi Udang Saus Asam Manis', 380, 600, 22, 82, 19],
  ['Nasi Udang Saus Tiram', 380, 610, 22, 80, 21],
  ['Nasi Udang Saus Mentega', 380, 620, 22, 80, 22],
  ['Nasi Cumi Goreng Tepung', 380, 610, 23, 80, 21],
  ['Nasi Cumi Saus Mentega', 380, 620, 23, 80, 22],
  ['Nasi Cumi Saus Tiram', 380, 600, 23, 78, 20],

  // ---- SOP, SOTO & SAYURAN ----
  ['Nasi Rawon Solaria', 420, 560, 28, 70, 18],
  ['Nasi Sup Iga Sapi', 450, 600, 30, 68, 22],
  ['Soto Ayam + Nasi', 450, 480, 24, 68, 12],
  ['Soto Betawi + Nasi', 450, 620, 24, 64, 30],
  ['Sapo Tahu Seafood', 350, 340, 18, 28, 14],
  ['Sapo Tahu Ayam', 350, 310, 18, 26, 12],
  ['Cap Cay Seafood', 350, 290, 16, 30, 11],
  ['Cap Cay Ayam', 350, 270, 16, 28, 10],
  ['Sup Ayam Asparagus', 300, 190, 14, 18, 7],
  ['Sup Ayam Corn (Jagung)', 300, 180, 12, 20, 6],
  ['Sup Kepiting Asparagus', 300, 200, 15, 18, 7],

  // ---- PASTA ----
  ['Spaghetti Bolognese', 300, 500, 20, 70, 15],
  ['Spaghetti Carbonara', 300, 620, 22, 66, 30],
  ['Spaghetti Aglio Olio', 280, 540, 14, 70, 22],
  ['Fettuccine Chicken Mushroom', 320, 610, 24, 68, 27],
  ['Fettuccine Carbonara', 320, 640, 23, 66, 32],

  // ---- CEMILAN / APPETIZERS ----
  ['Siomay Ayam Solaria (4 pcs)', 150, 220, 11, 22, 9],
  ['Dimsum Hakau (4 pcs)', 100, 140, 7, 18, 4],
  ['Lumpia Goreng (3 pcs)', 120, 270, 6, 28, 14],
  ['Kentang Goreng Solaria', 140, 380, 5, 48, 19],
  ['Potato Wedges Solaria', 150, 350, 5, 46, 16],
  ['Calamari Goreng Tepung', 140, 360, 15, 29, 21],
  ['Chicken Wings Solaria (4 pcs)', 160, 420, 22, 18, 30],
  ['Fish Cake / Otak-Otak Goreng', 120, 240, 10, 22, 12],
  ['Garlic Bread (4 pcs)', 100, 310, 7, 36, 15],
  ['Roti Bakar Coklat Keju', 150, 420, 9, 58, 17],

  // ---- DESSERTS & DRINKS ----
  ['Es Teler Solaria', 300, 280, 3, 48, 9],
  ['Es Campur Solaria', 300, 260, 3, 52, 6],
  ['Es Cendol Durian', 300, 340, 4, 54, 12],
  ['Es Kacang Merah', 300, 240, 4, 48, 4],
  ['Jus Alpukat', 300, 280, 4, 34, 15],
  ['Jus Mangga', 300, 180, 2, 42, 1],
  ['Jus Jeruk', 300, 130, 1, 32, 0],
  ['Jus Melon', 300, 140, 1, 34, 0],
  ['Jus Strawberi', 300, 150, 1, 36, 0],
  ['Es Jeruk / Jeruk Hangat', 300, 110, 0, 27, 0],
  ['Es Teh Manis / Teh Manis Hangat', 300, 90, 0, 22, 0],
  ['Es Teh Tawar / Teh Tawar Hangat', 300, 3, 0, 1, 0],
  ['Es Lemon Tea', 300, 110, 0, 27, 0],
  ['Milkshake Cokelat', 360, 410, 10, 60, 14],
  ['Milkshake Strawberi', 360, 380, 9, 58, 12],
  ['Milkshake Vanilla', 360, 390, 10, 58, 13],
  ['Avocado Float', 350, 360, 5, 52, 15],
  ['Coffee Float Solaria', 350, 280, 4, 44, 10],
  ['Kopi Susu Solaria', 250, 160, 4, 24, 5],
  ['Kopi Hitam Solaria', 250, 10, 1, 2, 0],
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

// ===================== UMKM & STREET FOOD BRANDS =====================

const UMKM_FOOD_BRANDS: { brand: string; cat: FoodCategory; rows: Row[] }[] = [
  {
    brand: 'Republik Kebab',
    cat: 'Snacks',
    rows: [
      ['Kebab Beef Black Pepper Big', 210, 470, 21, 44, 23],
      ['Kebab Beef Black Pepper Small', 150, 340, 14, 35, 16],
      ['Kebab Daging Sapi Original (Big)', 200, 450, 20, 42, 22],
      ['Kebab Daging Sapi Original (Small)', 140, 320, 13, 33, 15],
      ['Kebab Creamy Cheese (Big)', 210, 480, 21, 43, 25],
      ['Kebab Creamy Cheese (Small)', 150, 350, 14, 34, 18],
      ['Kebab Spicy Garlic / BBQ (Big)', 210, 460, 20, 45, 23],
      ['Zuper Beef Kebab Big (Full Beef + Cheese)', 230, 530, 26, 40, 30],
      ['Cheese Fusion Kebab Big (3 Cheese)', 220, 510, 22, 42, 28],
      ['Kebab Jumbo Beef', 250, 550, 25, 50, 28],
      ['Kebab Ayam Crispy', 160, 360, 15, 38, 17],
      ['Roti John Original Beef', 220, 480, 20, 48, 22],
      ['Roti John Supreme (Sosis + Egg)', 260, 560, 24, 52, 28],
      ['Hotdog Kebab Sosis', 150, 350, 13, 34, 18],
      ['Roti Maryam Coklat Keju', 100, 310, 6, 42, 13],
      ['Roti Maryam Daging Sapi', 120, 330, 11, 38, 15],
      ['Burger Kebab Beef', 140, 330, 14, 32, 16],
    ],
  },
  {
    brand: 'Kebab Baba Rafi',
    cat: 'Snacks',
    rows: [
      ['Kebab Sapi Regular', 150, 330, 14, 34, 15],
      ['Kebab Full Meat Special', 180, 420, 22, 30, 24],
      ['Kebab Cheese Supreme', 165, 380, 16, 35, 19],
      ['Black Kebab Beef', 175, 410, 17, 38, 21],
      ['Kebab Chicken Crispy', 160, 350, 14, 37, 16],
      ['Kebab Mini (3 pcs)', 150, 320, 12, 32, 16],
    ],
  },
  {
    brand: 'Mie Gacoan',
    cat: 'Staples',
    rows: [
      ['Mie Suit (Gurih Tidak Pedas)', 200, 380, 12, 56, 12],
      ['Mie Hompimpa Level 1-4', 200, 390, 12, 57, 13],
      ['Mie Hompimpa Level 6-8', 200, 410, 12, 58, 14],
      ['Mie Gacoan Level 1-4 (Manis Pedas)', 210, 420, 12, 62, 14],
      ['Mie Gacoan Level 6-8 (Manis Pedas)', 210, 440, 12, 64, 15],
      ['Udang Keju (3 pcs)', 100, 260, 14, 18, 15],
      ['Udang Rambutan (3 pcs)', 100, 270, 12, 22, 15],
      ['Pangsit Goreng (2 pcs)', 90, 240, 8, 20, 14],
      ['Lumpia Udang (3 pcs)', 90, 220, 11, 18, 12],
      ['Es Gobet / Es Tecik', 300, 160, 1, 38, 1],
      ['Es Sluke / Es Petruk', 300, 170, 1, 40, 1],
    ],
  },
  {
    brand: 'Sabana Fried Chicken',
    cat: 'Proteins',
    rows: [
      ['Dada Ayam Sabana', 130, 340, 26, 12, 21],
      ['Paha Atas Sabana', 120, 320, 20, 11, 22],
      ['Paha Bawah Sabana', 90, 210, 14, 8, 14],
      ['Sayap Ayam Sabana', 70, 180, 11, 7, 12],
      ['Paket Ayam Geprek + Nasi', 320, 580, 28, 65, 23],
    ],
  },
  {
    brand: "d'BestO",
    cat: 'Proteins',
    rows: [
      ['Ayam Dada dBestO', 130, 350, 27, 13, 21],
      ['Ayam Paha Atas dBestO', 120, 330, 21, 12, 22],
      ['Ayam Sadas Pedas Spesial', 130, 370, 26, 15, 23],
      ['Burger dBestO Crispy', 140, 330, 14, 32, 16],
    ],
  },
  {
    brand: 'Rocket Chicken',
    cat: 'Proteins',
    rows: [
      ['Ayam Dada Rocket', 130, 345, 26, 13, 21],
      ['Ayam Geprek Rocket + Nasi', 320, 575, 27, 65, 22],
      ['Chicken Strips Rocket (3 pcs)', 110, 290, 17, 18, 16],
    ],
  },
  {
    brand: 'Olive Fried Chicken',
    cat: 'Proteins',
    rows: [
      ['Ayam Dada Olive', 130, 340, 26, 12, 21],
      ['Ayam Paha Atas Olive', 120, 320, 20, 11, 22],
      ['Ayam Geprek Olive', 140, 370, 25, 14, 23],
    ],
  },
  {
    brand: 'Martabak UMKM',
    cat: 'Snacks',
    rows: [
      ['Martabak Telur Daging Sapi (2 Telur)', 250, 580, 24, 36, 38],
      ['Martabak Telur Daging Ayam (2 Telur)', 250, 520, 22, 36, 32],
      ['Martabak Manis Coklat Keju Wijen', 200, 620, 12, 74, 30],
      ['Martabak Manis Keju Susu Spesial', 180, 540, 14, 62, 26],
      ['Martabak Tipker Coklat Keju', 100, 380, 6, 50, 17],
    ],
  },
  {
    brand: 'Roti O & Roti Boy',
    cat: 'Snacks',
    rows: [
      ['Roti O Coffee Bun', 80, 280, 6, 36, 12],
      ['Roti Boy Coffee Bun', 80, 275, 6, 35, 12],
      ['Pastry Chocolate Roti O', 90, 320, 5, 38, 16],
      ['Pastry Cheese Roti O', 90, 310, 6, 36, 15],
    ],
  },
  {
    brand: 'Tahu Go! & Tahu Jeletot',
    cat: 'Snacks',
    rows: [
      ['Tahu Go Crispy (5 pcs)', 120, 260, 10, 18, 16],
      ['Tahu Jeletot Pedas (2 pcs)', 130, 290, 11, 22, 18],
      ['Tahu Walik Goreng (4 pcs)', 120, 280, 12, 20, 17],
    ],
  },
  {
    brand: 'Seblak Bandung UMKM',
    cat: 'Staples',
    rows: [
      ['Seblak Komplit (Ceker, Sosis, Telur, Kerupuk)', 350, 480, 18, 52, 22],
      ['Seblak Mie Makaroni Bakso Pedas', 300, 420, 14, 55, 16],
    ],
  },
  {
    brand: 'Siomay & Batagor Bandung',
    cat: 'Snacks',
    rows: [
      ['Siomay Ikan Bumbu Kacang (4 pcs)', 200, 340, 16, 30, 17],
      ['Batagor Goreng Bumbu Kacang (4 pcs)', 220, 420, 14, 38, 24],
    ],
  },
  {
    brand: 'Es Teh Solo & Teh Poci UMKM',
    cat: 'Dairy & Drinks',
    rows: [
      ['Es Teh Solo Manis Jumbo', 400, 110, 0, 28, 0],
      ['Teh Poci Es Manis Jumbo', 400, 120, 0, 30, 0],
      ['Es Teh Kampul Solo', 400, 125, 0, 31, 0],
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
  ...UMKM_FOOD_BRANDS.flatMap((g) => build(g.brand, g.cat, g.rows)),
];
