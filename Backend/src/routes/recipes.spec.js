const request = require('supertest');
const {
  expect
} = require('chai');

const {
  setup,
  cleanup,
  syncDB,
  randomString,
  createUser,
  createSession,
  createRecipe,
  createLabel,
  associateLabel,
  randomUuid
} = require('../testutils');

// DB
const Op = require('sequelize').Op;
const Recipe = require('../models').Recipe;
const Label = require('../models').Label;

describe('recipes', () => {
  let server;
  beforeAll(async () => {
    server = await setup();
  });

  beforeEach(async () => {
    await syncDB();
  });

  afterAll(async () => {
    await cleanup(server);
  });

  describe('create', () => {
    it('succeeds for personal recipe with valid payload, no image', async () => {
      let user = await createUser();

      let session = await createSession(user.id);

      let payload = {
        title: randomString(20),
        description: randomString(20),
        yield: randomString(20),
        activeTime: randomString(20),
        totalTime: randomString(20),
        source: randomString(20),
        url: randomString(20),
        notes: randomString(20),
        ingredients: randomString(20),
        instructions: randomString(20),
        rating: 3,
      };

      return request(server)
        .post('/recipes')
        .query({ token: session.token })
        .send(payload)
        .expect(201)
        .then(({ body }) =>
          Recipe.findOne({
            where: {
              [Op.and]: [payload, { id: body.id, userId: user.id }]
            }
          }).then(recipe => {
            expect(recipe).not.to.be.null;
          }).then(() => {
            Recipe.count().then(count => {
              expect(count).to.equal(1);
            });
          })
        );
    });

    it('allows null fields', async () => {
      let user = await createUser();

      let session = await createSession(user.id);

      let payload = {
        title: randomString(20)
      };

      return request(server)
        .post('/recipes')
        .query({ token: session.token })
        .send(payload)
        .expect(201)
        .then(({ body }) =>
          Recipe.findOne({
            where: {
              [Op.and]: [payload, { id: body.id, userId: user.id }]
            }
          }).then(recipe => {
            expect(recipe).not.to.be.null;
          }).then(() => {
            Recipe.count().then(count => {
              expect(count).to.equal(1);
            });
          })
        );
    });

    it('rejects if no title is present', async () => {
      let user = await createUser();

      let session = await createSession(user.id);

      let payload = {
        description: randomString(20),
        yield: randomString(20),
        activeTime: randomString(20),
        totalTime: randomString(20),
        source: randomString(20),
        url: randomString(20),
        notes: randomString(20),
        ingredients: randomString(20),
        instructions: randomString(20),
        rating: 3,
      };

      return request(server)
        .post('/recipes')
        .query({ token: session.token })
        .send(payload)
        .expect(412)
        .then(() =>
          Recipe.count().then(count => {
            expect(count).to.equal(0);
          })
        );
    });

    it('rejects if title is an empty string', async () => {
      let user = await createUser();

      let session = await createSession(user.id);

      let payload = {
        title: '',
        description: randomString(20),
        yield: randomString(20),
        activeTime: randomString(20),
        totalTime: randomString(20),
        source: randomString(20),
        url: randomString(20),
        notes: randomString(20),
        ingredients: randomString(20),
        instructions: randomString(20),
        rating: 3,
      };

      return request(server)
        .post('/recipes')
        .query({ token: session.token })
        .send(payload)
        .expect(412)
        .then(() =>
          Recipe.count().then(count => {
            expect(count).to.equal(0);
          })
        );
    });

    it('rejects invalid token', async () => {
      let payload = {
        title: randomString(20),
        description: randomString(20),
        yield: randomString(20),
        activeTime: randomString(20),
        totalTime: randomString(20),
        source: randomString(20),
        url: randomString(20),
        notes: randomString(20),
        ingredients: randomString(20),
        instructions: randomString(20),
        rating: 3,
      };

      return request(server)
        .post('/recipes')
        .send(payload)
        .query({ token: 'invalid' })
        .expect(401)
        .then(() =>
          Recipe.count().then(count => {
            expect(count).to.equal(0);
          })
        );
    });
  });

  describe('get single', () => {
    it('returns recipe', async () => {
      let user = await createUser();

      let session = await createSession(user.id);

      let recipe = await createRecipe(user.id);

      let label = await createLabel(user.id);

      await associateLabel(label.id, recipe.id);

      return request(server)
        .get(`/recipes/${recipe.id}`)
        .query({ token: session.token })
        .expect(200)
        .then(({ body }) => {
          expect(body.id).to.equal(recipe.id);
          expect(body.title).to.equal(recipe.title);
          expect(body.labels.length).to.equal(1);
        });
    });

    it('rejects invalid recipeId', async () => {
      let user = await createUser();

      let session = await createSession(user.id);

      await createRecipe(user.id);

      return request(server)
        .get(`/recipes/${randomUuid()}`)
        .query({ token: session.token })
        .expect(404);
    });

    it('returns recipes belonging to another user', async () => {
      let user1 = await createUser();
      let user2 = await createUser();

      let session = await createSession(user1.id);

      let recipe = await createRecipe(user2.id);

      let label = await createLabel(user2.id);

      await associateLabel(label.id, recipe.id);

      return request(server)
        .get(`/recipes/${recipe.id}`)
        .query({ token: session.token })
        .expect(200)
        .then(({ body }) => {
          expect(body.id).to.equal(recipe.id);
          expect(body.title).to.equal(recipe.title);
          expect(body.labels).to.be.an('array').that.is.empty;
          expect(body.labels.length).to.equal(0);
          expect(body.isOwner).to.equal(false);
        });
    });

    it('returns recipe with no token', async () => {
      let user2 = await createUser();

      let recipe = await createRecipe(user2.id);

      let label = await createLabel(user2.id);

      await associateLabel(label.id, recipe.id);

      return request(server)
        .get(`/recipes/${recipe.id}`)
        .expect(200)
        .then(({ body }) => {
          expect(body.id).to.equal(recipe.id);
          expect(body.title).to.equal(recipe.title);
          expect(body.labels).to.be.an('array').that.is.empty;
          expect(body.labels.length).to.equal(0);
          expect(body.isOwner).to.equal(false);
        });
    });

    it('denies invalid session', async () => {
      let user = await createUser();

      let recipe = await createRecipe(user.id);

      return request(server)
        .get(`/recipes/${recipe.id}`)
        .query({ token: 'invalid' })
        .expect(401);
    });
  });

  describe('update', () => {
    it('updates recipe', async () => {
      let user = await createUser();

      let session = await createSession(user.id);

      let recipe = await createRecipe(user.id);

      let payload = {
        title: `new-${randomString(20)}`,
        description: `new-${randomString(20)}`,
        yield: `new-${randomString(20)}`,
        activeTime: `new-${randomString(20)}`,
        totalTime: `new-${randomString(20)}`,
        source: `new-${randomString(20)}`,
        url: `new-${randomString(20)}`,
        notes: `new-${randomString(20)}`,
        ingredients: `new-${randomString(20)}`,
        instructions: `new-${randomString(20)}`,
        rating: 3,
        folder: 'main',
      };

      return request(server)
        .put(`/recipes/${recipe.id}`)
        .send(payload)
        .query({ token: session.token })
        .expect(200)
        .then(() =>
          Recipe.findByPk(recipe.id).then(updatedRecipe => {
            expect(updatedRecipe.title).to.equal(payload.title);
            expect(updatedRecipe.description).to.equal(payload.description);
            expect(updatedRecipe.yield).to.equal(payload.yield);
            expect(updatedRecipe.activeTime).to.equal(payload.activeTime);
            expect(updatedRecipe.totalTime).to.equal(payload.totalTime);
            expect(updatedRecipe.source).to.equal(payload.source);
            expect(updatedRecipe.url).to.equal(payload.url);
            expect(updatedRecipe.notes).to.equal(payload.notes);
            expect(updatedRecipe.ingredients).to.equal(payload.ingredients);
            expect(updatedRecipe.instructions).to.equal(payload.instructions);
            expect(updatedRecipe.folder).to.equal(payload.folder);
          })
        );
    });

    it('rejects invalid recipeId', async () => {
      let user = await createUser();

      let session = await createSession(user.id);

      return request(server)
        .put(`/recipes/${randomUuid()}`)
        .send({})
        .query({ token: session.token })
        .expect(404);
    });

    it('rejects request if recipe does not belong to user', async () => {
      let user1 = await createUser();
      let user2 = await createUser();

      let session = await createSession(user1.id);

      let recipe = await createRecipe(user2.id);

      return request(server)
        .put(`/recipes/${recipe.id}`)
        .send({})
        .query({ token: session.token })
        .expect(404);
    });

    it('requires valid session', async () => {
      let user = await createUser();

      let recipe = await createRecipe(user.id);

      return request(server)
        .put(`/recipes/${recipe.id}`)
        .send({})
        .query({ token: 'invalid' })
        .expect(401);
    });
  });

  describe('delete all', () => {
    it('deletes all recipes and labels', async () => {
      let user = await createUser();

      let session = await createSession(user.id);

      let recipe1 = await createRecipe(user.id);
      let recipe2 = await createRecipe(user.id);

      let label1 = await createLabel(user.id);
      let label2 = await createLabel(user.id);

      await associateLabel(label1.id, recipe1.id);
      await associateLabel(label2.id, recipe2.id);

      await request(server)
        .delete('/recipes/all')
        .query({ token: session.token })
        .expect(200)
        .then(async () => {
          await Recipe.findAll({
            where: {
              userId: user.id
            }
          }).then(async recipes => {
            expect(recipes).to.have.lengthOf(0);

            await Label.findAll({
              where: {
                userId: user.id
              }
            }).then(labels => {
              expect(labels).to.have.lengthOf(0);
            });
          });
        });
    });

    it('does not remove recipes or labels belonging to another user', async () => {
      let user1 = await createUser();
      let user2 = await createUser();

      let session = await createSession(user1.id);

      let recipe = await createRecipe(user2.id);

      let label = await createLabel(user2.id);

      await associateLabel(label.id, recipe.id);

      await request(server)
        .delete('/recipes/all')
        .query({ token: session.token })
        .then(async () => {
          await Recipe.findAll({
            where: {
              userId: user2.id
            }
          }).then(async recipes => {
            expect(recipes).to.have.lengthOf(1);

            await Label.findAll({
              where: {
                userId: user2.id
              }
            }).then(labels => {
              expect(labels).to.have.lengthOf(1);
            });
          });
        });
    });

    it('requires valid session', async () => {
      return request(server)
        .delete('/recipes/all')
        .query({ token: 'invalid' })
        .expect(401);
    });
  });

  describe('delete', () => {
    it('deletes recipe', async () => {
      let user = await createUser();

      let session = await createSession(user.id);

      let recipe = await createRecipe(user.id);

      return request(server)
        .delete(`/recipes/${recipe.id}`)
        .query({ token: session.token })
        .expect(200)
        .then(() => {
          Recipe.findByPk(recipe.id).then(recipe => {
            expect(recipe).to.be.null;
          });
        });
    });

    it('removes labels with only one association', async () => {
      let user = await createUser();

      let session = await createSession(user.id);

      let recipe = await createRecipe(user.id);

      let label1 = await createLabel(user.id);
      let label2 = await createLabel(user.id);

      await associateLabel(label1.id, recipe.id);
      await associateLabel(label2.id, recipe.id);

      return request(server)
        .delete(`/recipes/${recipe.id}`)
        .query({ token: session.token })
        .expect(200)
        .then(() =>
          Promise.all([
            Recipe.findByPk(recipe.id).then(deletedRecipe =>
              expect(deletedRecipe).to.be.null
            ),
            Label.findByPk(label1.id).then(deletedLabel1 =>
              expect(deletedLabel1).to.be.null
            ),
            Label.findByPk(label2.id).then(deletedLabel2 =>
              expect(deletedLabel2).to.be.null
            )
          ])
        );
    });

    it('does not remove labels with other associated recipes', async () => {
      let user = await createUser();

      let session = await createSession(user.id);

      let recipe1 = await createRecipe(user.id);
      let recipe2 = await createRecipe(user.id);

      let label = await createLabel(user.id);

      await associateLabel(label.id, recipe1.id);
      await associateLabel(label.id, recipe2.id);

      return request(server)
        .delete(`/recipes/${recipe1.id}`)
        .query({ token: session.token })
        .expect(200)
        .then(() =>
          Promise.all([
            Recipe.findByPk(recipe1.id).then(deletedRecipe1 =>
              expect(deletedRecipe1).to.be.null
            ),
            Recipe.findByPk(recipe2.id).then(notDeletedRecipe2 =>
              expect(notDeletedRecipe2).not.to.be.null
            ),
            Label.findByPk(label.id).then(deletedLabel =>
              expect(deletedLabel).not.to.be.null
            )
          ])
        );
    });

    it('rejects the request if user does not own recipe', async () => {
      let user1 = await createUser();
      let user2 = await createUser();

      let session = await createSession(user1.id);

      let recipe = await createRecipe(user2.id);

      return request(server)
        .delete(`/recipes/${recipe.id}`)
        .query({ token: session.token })
        .expect(404);
    });

    it('requires valid session', async () => {
      let user = await createUser();

      let recipe = await createRecipe(user.id);

      return request(server)
        .delete(`/recipes/${recipe.id}`)
        .query({ token: 'invalid' })
        .expect(401);
    });
  });
});
