import { startTransition, useEffect, useState } from 'react'
import './App.css'
import FirebaseAuthService from './FirebaseAuthService'
import LoginForm from './components/LoginForm'
import AddEditRecipeForm from './components/AddEditRecipeForm'
import FirebaseFirestoreService from './FirebaseFirestore'

function App() {
  const [user, setUser] = useState(null)
  const [currentRecipe, setCurrentRecipe] = useState(null)
  const [recipes, setRecipes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [orderBy, setOrderBy] = useState('publicDateDesc')

  useEffect(() => {
    setIsLoading(true)

    fetchRecipes()
      .then((fetchedRecipes) => {
        setRecipes(fetchedRecipes)
      })
      .catch((error) => {
        console.error(error.message)
        throw error
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [user, categoryFilter, orderBy])

  FirebaseAuthService.subscribeToAuthChanges(setUser)

  async function fetchRecipes() {
    const queries = []

    if (categoryFilter) {
      queries.push({
        field: 'category',
        condition: '==',
        value: categoryFilter,
      })
    }

    if (!user) {
      queries.push({
        field: 'isPublished',
        condition: '==',
        value: true,
      })
    }

    const orderByField = 'publishDate'
    let orderByDirection

    if (orderBy) {
      switch (orderBy) {
        case 'publishDateAsc':
          orderByDirection = 'asc'
          break
        case 'publishDateDesc':
          orderByDirection = 'desc'
          break
        default:
          break
      }
    }

    let fetchedRecipes = []

    try {
      const response =
        await FirebaseFirestoreService.readDocuments({
          collection: 'recipes',
          queries: queries,
          orderByField: orderByField,
          orderByDirection: orderByDirection,
        })

      const newRecipes = response.docs.map((recipeDoc) => {
        const id = recipeDoc.id
        const data = recipeDoc.data()
        data.publishDate = new Date(
          data.publishDate.seconds * 1000,
        )

        return { ...data, id }
      })

      fetchedRecipes = [...newRecipes]
    } catch (error) {
      console.error(error.message)
      throw error
    }

    return fetchedRecipes
  }

  async function handleFetchedRecipes() {
    try {
      const fetchedRecipes = await fetchRecipes()

      setRecipes(fetchedRecipes)
    } catch (error) {
      console.error(error.message)
      throw error
    }
  }

  async function handleAddRecipe(newRecipe) {
    try {
      const response =
        await FirebaseFirestoreService.createDocument(
          'recipes',
          newRecipe,
        )

      handleFetchedRecipes()

      alert(
        `succesfully created a recipe with an ID = ${response.id}`,
      )
    } catch (error) {
      alert(error.message)
    }
  }

  async function handleUpdateRecipe(newRecipe, recipeId) {
    try {
      await FirebaseFirestoreService.updateDocuemnt(
        'recipes',
        recipeId,
        newRecipe,
      )

      handleFetchedRecipes()

      alert(
        `successfully updated a recipe with an ID = ${recipeId}`,
      )
      setCurrentRecipe(null)
    } catch (error) {
      console.error(error.message)
      throw error
    }
  }

  async function handleDeleteRecipe(recipeId) {
    const deleteConfirmation = window.confirm(
      'Are you sure you want to delete this repcie? ok for Yes. Cancel for No',
    )

    if (deleteConfirmation) {
      try {
        await FirebaseFirestoreService.deleteDocument(
          'recipes',
          recipeId,
        )

        handleFetchedRecipes()

        setCurrentRecipe(null)

        window.scrollTo(0, 0)

        alert(
          `Successfully deleted a recipe with an ID = ${recipeId}`,
        )
      } catch (error) {
        alert(error.message)
      }
    }
  }

  function handleEditRecipeClick(recipeId) {
    const selectedRecipe = recipes.find((recipe) => {
      return recipe.id === recipeId
    })

    if (selectedRecipe) {
      startTransition(() => {
        setCurrentRecipe(selectedRecipe)
      })
      window.scrollTo(0, document.body.scrollHeight)
    }
  }

  function handleEditRecipeCancel() {
    startTransition(() => {
      setCurrentRecipe(null)
    })
  }

  function lookupCategoryLabel(categoryKey) {
    const categories = {
      breadsSanwichAndPizza:
        'Breads, Sandwiches, and Pizzas',
      eggsAndBreakfast: 'Eggs & Breakfast',
      desertsAndBakeGoods: 'Desserts & Bake Goods',
      fishAndSeafood: 'Fish & Seafood',
      vegetables: 'Vegetables',
    }

    const labels = categories[categoryKey]

    return labels
  }

  function formatDate(date) {
    return date.toLocaleDateString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }
  return (
    <div className='App'>
      <div className='title-row'>
        <h1 className='title'>Firebase Recipes</h1>
        <LoginForm existingUser={user} />
      </div>
      <div className='main'>
        <div className='row filters'>
          <label className='recipe-label input-label'>
            Category:
            <select
              value={categoryFilter}
              onChange={(e) =>
                startTransition(() =>
                  setCategoryFilter(e.target.value),
                )
              }
              className='select'
              required
            >
              <option value=''></option>
              <option value='breadsSanwichAndPizza'>
                Breads, Sandwiches, and Pizzas
              </option>
              <option value='eggsAndBreakfast'>
                Eggs & Breakfast
              </option>
              <option value='desertsAndBakeGoods'>
                Desserts & Bake Goods
              </option>
              <option value='fishAndSeafood'>
                Fish & Seafood
              </option>
              <option value='vegetables'>Vegetables</option>
            </select>
          </label>
          <label className='input-label'>
            <select
              value={orderBy}
              onChange={(e) =>
                startTransition(() =>
                  setOrderBy(e.target.value),
                )
              }
              className='select'
            >
              <option value='publishDateDesc'>
                Publish Date (newest - oldest)
              </option>
              <option value='publishDateAsc'>
                Publish Date (oldest - newest)
              </option>
            </select>
          </label>
        </div>
        <div className='center'>
          <div className='recipe-list-box'>
            {isLoading && (
              <div className='fire'>
                <div className='flames'>
                  <div className='flame'></div>
                  <div className='flame'></div>
                  <div className='flame'></div>
                  <div className='flame'></div>
                </div>
                <div className='logs'></div>
              </div>
            )}
            {!isLoading &&
              recipes &&
              recipes.length === 0 && (
                <h5 className='no-recipes'>
                  No Recipes Found bro
                </h5>
              )}
            {!isLoading && recipes && recipes.length > 0 ? (
              <div className='recipe-list'>
                {recipes.map((recipe) => {
                  return (
                    <div
                      className='recipe-card'
                      key={recipe.id}
                    >
                      {recipe.isPublished === false ? (
                        <div className='unpublished'>
                          UNPUBLISHED
                        </div>
                      ) : null}
                      <div className='recipe-name'>
                        {recipe.name}
                      </div>
                      <div className='recipe-field'>
                        Category:{' '}
                        {lookupCategoryLabel(
                          recipe.category,
                        )}
                      </div>
                      <div className='recipe-field'>
                        Publish Date:{' '}
                        {formatDate(recipe.publishDate)}
                      </div>
                      {user ? (
                        <button
                          type='button'
                          onClick={() =>
                            handleEditRecipeClick(recipe.id)
                          }
                          className='primary-button edit-button'
                        >
                          EDIT
                        </button>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>
        </div>
        {user && (
          <AddEditRecipeForm
            existingRecipe={currentRecipe}
            handleAddRecipe={handleAddRecipe}
            handleUpdateRecipe={handleUpdateRecipe}
            handleDeleteRecipe={handleDeleteRecipe}
            handleEditRecipeCancel={handleEditRecipeCancel}
          ></AddEditRecipeForm>
        )}
      </div>
    </div>
  )
}

export default App
