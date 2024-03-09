const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const FirebaseConfig = require('./FirebaseConfig')
const Utilities = require('./utilities')

const auth = FirebaseConfig.auth
const firestore = FirebaseConfig.firestore

const app = express()

app.use(cors({ origin: true }))

app.use(bodyParser.json())

// RESTFUL CRUD WEB API ENDPOINTS

app.post('/recipes', async (request, response) => {
  const authorizationHeader =
    request.headers['authorization']

  if (!authorizationHeader) {
    response
      .status(401)
      .send('Missing Authorization Header')
    return
  }

  try {
    await Utilities.authorizeUser(authorizationHeader, auth)
  } catch (error) {
    response.status(401).send(error.message)
    return
  }

  const newRecipe = request.body
  const missingField =
    Utilities.validateRecipePostPut(newRecipe)

  if (missingField) {
    response
      .status(400)
      .send(
        `Recipe is not valid. Missing/invalid fields: ${missingField}`,
      )
    return
  }

  const recipe = Utilities.sanitizeRecipePostPut(newRecipe)

  try {
    const firestoreResponse = await firestore
      .collection('recipes')
      .add(recipe)

    const recipeId = firestoreResponse.id

    response.status(201).send({ id: recipeId })
  } catch (error) {
    response.status(400).send(error.message)
  }
})

app.get('/', (req, res) => {
  res.send('Hello from firebase functions express API')
})

if (process.env.NODE_ENV !== 'production') {
  // Local dev
  app.listen(3005, () => {
    console.log('api started')
  })
}

module.exports = app
