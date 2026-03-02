import { v } from "convex/values";
import { mutation } from "./_generated/server";

const collectionsData = [
  { name: "Tacos",       imageId: "kg28f6928fehevqrknxch9bv6x7qmzgk" },
  { name: "Comida",      imageId: "kg28f6928fehevqrknxch9bv6x7qmzgk" },
  { name: "Bebidas",     imageId: "kg28f6928fehevqrknxch9bv6x7qmzgk" },
  { name: "Juegos",      imageId: "kg26738msgfp1nbjv3yvfrww997qmn6n" },
  { name: "Música",      imageId: "kg24hn7cwdh9ys1d7jz6xyk2k17qmgkh" },
  { name: "Animales",    imageId: "kg2by1zd2rf1rhkegy68qj4zk97qnfvq" },
  { name: "Plantas",     imageId: "kg2cewsy1r6khthn04m0e5mp097qmcdp" },
  { name: "Artistas",    imageId: "kg24x5rn7j94z7hzsafjgnjdgd7qm573" },
  { name: "Monumentos",  imageId: "kg24x5rn7j94z7hzsafjgnjdgd7qm573" },
  { name: "Historia",    imageId: "kg235t2jk4cbda0dedpx5c14cx7qnqqr" },
  { name: "Tradiciones", imageId: "kg235t2jk4cbda0dedpx5c14cx7qnqqr" },
];

export const seedCollections = mutation({
  args: {},
  handler: async (ctx) => {
    const existingCollections = await ctx.db.query("collections").collect();
    if (existingCollections.length > 0) {
      return { message: "Collections already seeded" };
    }

    for (const item of collectionsData) {
      await ctx.db.insert("collections", {
        name: item.name,
        image: item.imageId
      });
    }

    return { message: "Collections seeded successfully" };
  },
});

export const addCollectionCard = mutation({
  args: {
    collectionId: v.id("collections"),
    name: v.string(),
    imageId: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("collectionCards", {
      collectionId: args.collectionId,
      name: args.name,
      image: args.imageId
    })
  }
})

const cards = [
  // ── TACOS (9) — tipos de taco mexicanos ──────────────────────────────────
  { category: "Tacos", element: "Taco al pastor" },
  { category: "Tacos", element: "Taco de carnitas" },
  { category: "Tacos", element: "Taco de barbacoa" },
  { category: "Tacos", element: "Taco de canasta" },
  { category: "Tacos", element: "Taco de suadero" },
  { category: "Tacos", element: "Taco de birria" },
  { category: "Tacos", element: "Taco de chicharrón" },
  { category: "Tacos", element: "Taco placero" },
  { category: "Tacos", element: "Taco dorado" },

  // ── COMIDA (9) — platillos mexicanos (sin tacos) ─────────────────────────
  { category: "Comida", element: "Tamales" },
  { category: "Comida", element: "Pozole" },
  { category: "Comida", element: "Mole negro" },
  { category: "Comida", element: "Enchiladas" },
  { category: "Comida", element: "Chilaquiles" },
  { category: "Comida", element: "Guacamole" },
  { category: "Comida", element: "Cochinita pibil" },
  { category: "Comida", element: "Chiles en nogada" },
  { category: "Comida", element: "Tlayuda" },

  // ── BEBIDAS (9) — bebidas mexicanas ─────────────────────────────────────
  { category: "Bebidas", element: "Tequila" },
  { category: "Bebidas", element: "Mezcal" },
  { category: "Bebidas", element: "Pulque" },
  { category: "Bebidas", element: "Agua de horchata" },
  { category: "Bebidas", element: "Agua de jamaica" },
  { category: "Bebidas", element: "Tepache" },
  { category: "Bebidas", element: "Atole" },
  { category: "Bebidas", element: "Champurrado" },
  { category: "Bebidas", element: "Tejuino" },

  // ── JUEGOS (9) — juegos tradicionales mexicanos ──────────────────────────
  { category: "Juegos", element: "Lotería" },
  { category: "Juegos", element: "Trompo" },
  { category: "Juegos", element: "Balero" },
  { category: "Juegos", element: "Canicas" },
  { category: "Juegos", element: "Pirinola" },
  { category: "Juegos", element: "Rayuela" },
  { category: "Juegos", element: "Serpientes y escaleras" },
  { category: "Juegos", element: "Yoyo" },
  { category: "Juegos", element: "Volados" },

  // ── MÚSICA (9) — géneros y estilos musicales mexicanos ───────────────────
  { category: "Música", element: "Mariachi" },
  { category: "Música", element: "Ranchera" },
  { category: "Música", element: "Corrido" },
  { category: "Música", element: "Banda sinaloense" },
  { category: "Música", element: "Son jarocho" },
  { category: "Música", element: "Huapango" },
  { category: "Música", element: "Cumbia mexicana" },
  { category: "Música", element: "Norteño" },
  { category: "Música", element: "Bolero mexicano" },

  // ── ANIMALES (9) — fauna mexicana ────────────────────────────────────────
  { category: "Animales", element: "Águila real" },
  { category: "Animales", element: "Xoloitzcuintle" },
  { category: "Animales", element: "Jaguar" },
  { category: "Animales", element: "Ajolote" },
  { category: "Animales", element: "Chapulín" },
  { category: "Animales", element: "Serpiente cascabel" },
  { category: "Animales", element: "Guacamaya" },
  { category: "Animales", element: "Cenzontle" },
  { category: "Animales", element: "Armadillo" },

  // ── PLANTAS (9) — flora y plantas sagradas mexicanas ─────────────────────
  { category: "Plantas", element: "Nopal" },
  { category: "Plantas", element: "Maguey" },
  { category: "Plantas", element: "Cacao" },
  { category: "Plantas", element: "Maíz" },
  { category: "Plantas", element: "Flor de cempasúchil" },
  { category: "Plantas", element: "Chile" },
  { category: "Plantas", element: "Aguacate" },
  { category: "Plantas", element: "Vainilla" },
  { category: "Plantas", element: "Flor de nochebuena" },

  // ── ARTISTAS (9) — artistas y creadores mexicanos ────────────────────────
  { category: "Artistas", element: "Frida Kahlo" },
  { category: "Artistas", element: "Diego Rivera" },
  { category: "Artistas", element: "José Clemente Orozco" },
  { category: "Artistas", element: "Juan Gabriel" },
  { category: "Artistas", element: "Vicente Fernández" },
  { category: "Artistas", element: "Pedro Infante" },
  { category: "Artistas", element: "Rufino Tamayo" },
  { category: "Artistas", element: "Octavio Paz" },
  { category: "Artistas", element: "Lila Downs" },

  // ── MONUMENTOS (9) — sitios y monumentos icónicos de México ──────────────
  { category: "Monumentos", element: "Ángel de la Independencia" },
  { category: "Monumentos", element: "Palacio de Bellas Artes" },
  { category: "Monumentos", element: "Chichén Itzá" },
  { category: "Monumentos", element: "Teotihuacán" },
  { category: "Monumentos", element: "Catedral Metropolitana" },
  { category: "Monumentos", element: "Basílica de Guadalupe" },
  { category: "Monumentos", element: "Castillo de Chapultepec" },
  { category: "Monumentos", element: "Templo Mayor" },
  { category: "Monumentos", element: "Monte Albán" },

  // ── HISTORIA (9) — héroes y momentos clave de México ─────────────────────
  { category: "Historia", element: "Miguel Hidalgo" },
  { category: "Historia", element: "Benito Juárez" },
  { category: "Historia", element: "Emiliano Zapata" },
  { category: "Historia", element: "Pancho Villa" },
  { category: "Historia", element: "Revolución Mexicana" },
  { category: "Historia", element: "Independencia de México" },
  { category: "Historia", element: "Imperio Azteca" },
  { category: "Historia", element: "Lázaro Cárdenas" },
  { category: "Historia", element: "Constitución de 1917" },

  // ── TRADICIONES (9) — fiestas y costumbres mexicanas ─────────────────────
  { category: "Tradiciones", element: "Día de Muertos" },
  { category: "Tradiciones", element: "Posadas navideñas" },
  { category: "Tradiciones", element: "Piñata" },
  { category: "Tradiciones", element: "Guelaguetza" },
  { category: "Tradiciones", element: "Lucha Libre" },
  { category: "Tradiciones", element: "Quinceañera" },
  { category: "Tradiciones", element: "Charreada" },
  { category: "Tradiciones", element: "Día de Reyes" },
  { category: "Tradiciones", element: "Carnaval de Veracruz" },
];

export const seedCards = mutation({
  args: {},
  handler: async (ctx) => {
    const existingCollections = await ctx.db.query("collections").collect();
    if (existingCollections.length == 0) {
      return { message: "Collections do not exist" };
    }

    for (const card of cards) {
      await ctx.db.insert("collectionCards", {
        collectionId: existingCollections.find(collection => collection.name == card.category)?._id!,
        name: card.element,
        image: ""
      });
    }

  }
});

// ── Reseed: borra todo y vuelve a crear colecciones + cartas ──────────────
export const reseedCollections = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Borrar todas las cartas existentes
    const existingCards = await ctx.db.query("collectionCards").collect();
    for (const card of existingCards) {
      await ctx.db.delete(card._id);
    }

    // 2. Borrar todas las colecciones existentes
    const existingCollections = await ctx.db.query("collections").collect();
    for (const col of existingCollections) {
      await ctx.db.delete(col._id);
    }

    // 3. Crear colecciones nuevas
    const collectionIds: Record<string, any> = {};
    for (const item of collectionsData) {
      const id = await ctx.db.insert("collections", {
        name: item.name,
        image: item.imageId,
      });
      collectionIds[item.name] = id;
    }

    // 4. Crear cartas nuevas
    let cardCount = 0;
    for (const card of cards) {
      const collectionId = collectionIds[card.category];
      if (collectionId) {
        await ctx.db.insert("collectionCards", {
          collectionId,
          name: card.element,
          image: "",
        });
        cardCount++;
      }
    }

    return {
      message: `Reseed completo: ${Object.keys(collectionIds).length} colecciones, ${cardCount} cartas`,
    };
  },
});
