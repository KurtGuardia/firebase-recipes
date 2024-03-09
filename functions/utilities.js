const authorizeUser = async (
  authorizationHeader,
  firebaseAuth,
) => {
  if (!authorizationHeader) {
    // eslint-disable-next-line no-throw-literal
    throw 'no authorization provided'
  }

  const token = authorizationHeader.split(' ')[1]

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(
      token,
    )

    return decodedToken
  } catch (error) {
    console.error(error.message)
    throw error
  }
}

const validateRecipePostPut = (newRecipe) => {
  let missingFileds = ''

  if (!newRecipe) {
    missingFileds += 'recipe'
    return missingFileds
  }

  if (!newRecipe.name) {
    missingFileds += 'name,'
  }

  if (!newRecipe.category) {
    missingFileds += 'category,'
  }

  if (!newRecipe.directions) {
    missingFileds += 'directions,'
  }

  if (
    !newRecipe.isPublished !== true &&
    newRecipe.isPublished !== false
  ) {
    missingFileds += 'isPublished,'
  }

  if (!newRecipe.publishDate) {
    missingFileds += 'publishDate,'
  }

  if (
    !newRecipe.ingredients ||
    newRecipe.ingredients.length === 0
  ) {
    missingFileds += 'ingredients,'
  }

  if (newRecipe.imageUrl) {
    missingFileds += 'imageUrl,'
  }

  return missingFileds
}

const sanitizeRecipePostPut = (newRecipe) => {
  const recipe = {}

  recipe.name = newRecipe.name
  recipe.category = newRecipe.category
  recipe.directions = newRecipe.directions
  recipe.publishDate = new Date(
    newRecipe.publishDate * 1000,
  )
  recipe.isPublished = newRecipe.isPublished
  recipe.ingredients = newRecipe.ingredients
  recipe.imageUrl = newRecipe.imageUrl

  return recipe
}

module.exports = {
  authorizeUser,
  validateRecipePostPut,
  sanitizeRecipePostPut,
}
