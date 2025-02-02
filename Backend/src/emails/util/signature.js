const { dedent } = require('ts-dedent');

const signatureHtml = dedent`
  <br /><br />Best,
  <br />Julian Poyourow
  <br />Developer of RecipeSage - <a href="https://recipesage.com">https://recipesage.com</a>
  <br /><br />
  <b>Social:</b><br />
  Discord: <a href="https://discord.gg/yCfzBft">https://discord.gg/yCfzBft</a><br />
  Facebook: <a href="https://www.facebook.com/recipesageofficial/">https://www.facebook.com/recipesageofficial/</a><br />
  Instagram: <a href="https://www.instagram.com/recipesageofficial/">https://www.instagram.com/recipesageofficial/</a><br />
  Twitter: <a href="https://twitter.com/RecipeSageO">https://twitter.com/RecipeSageO</a>
`;

const signaturePlain = dedent`
  Best,
  Julian Poyourow
  Developer of RecipeSage - https://recipesage.com

  Social:
  https://discord.gg/yCfzBft
  https://www.facebook.com/recipesageofficial/
  https://www.instagram.com/recipesageofficial/
  https://twitter.com/RecipeSageO
`;

module.exports = {
  signatureHtml,
  signaturePlain,
};

