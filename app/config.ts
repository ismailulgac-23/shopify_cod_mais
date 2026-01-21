export const getEnv = (shop: any = undefined) => {
  if (shop == "m2gtzh-yv.myshopify.com") {
    return {
      key: process.env.SHOPIFY_API_KEY_MAIS,
      secret: process.env.SHOPIFY_API_SECRET_MAIS,
    };
  }

  return {
    key: process.env.SHOPIFY_API_KEY,
    secret: process.env.SHOPIFY_API_SECRET,
  };
};
