import { startTransition, useEffect, useState } from 'react'
import './App.css'
import FirebaseAuthService from './FirebaseAuthService'
import LoginForm from './components/LoginForm'
import AddEditRecipeForm from './components/AddEditRecipeForm'
// import FirebaseFirestoreService from './FirebaseFirestore'
import FirebaseFirestoreRestService from './FirebaseFirestoreRestService'

function App() {
  const [user, setUser] = useState(null)
  const [currentRecipe, setCurrentRecipe] = useState(null)
  const [recipes, setRecipes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [orderBy, setOrderBy] = useState('publicDateDesc')
  const [recipesPerPage, setRecipesPerPage] = useState(3)
  const [isLastPage, setIsLastPage] = useState(false)
  const [totalNumberOfPages, setTotalNumberOfPages] =
    useState(0)
  const [currentPageNumber, setCurrentPageNumber] =
    useState(1)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user,
    categoryFilter,
    orderBy,
    recipesPerPage,
    currentPageNumber,
  ])

  FirebaseAuthService.subscribeToAuthChanges(setUser)

  async function fetchRecipes(cursorId = '') {
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
      // const response =
      //   await FirebaseFirestoreService.readDocuments({
      //     collection: 'recipes',
      //     queries: queries,
      //     orderByField: orderByField,
      //     orderByDirection: orderByDirection,
      //     perPage: recipesPerPage,
      //     cursorId: cursorId,
      //   })

      // const newRecipes = response.docs.map((recipeDoc) => {
      //   const id = recipeDoc.id
      //   const data = recipeDoc.data()
      //   data.publishDate = new Date(
      //     data.publishDate.seconds * 1000,
      //   )

      //   return { ...data, id }
      // })

      // if (cursorId) {
      //   fetchedRecipes = [...recipes, ...newRecipes]
      // } else {
      //   fetchedRecipes = [...newRecipes]
      // }

      const response =
        await FirebaseFirestoreRestService.readDcoments({
          collection: 'recipes',
          queries: queries,
          orderByField: orderByField,
          orderByDirection: orderByDirection,
          perPage: recipesPerPage,
          pageNumber: currentPageNumber,
        })

      if (response && response.documents) {
        const totalNumberOfPages = Math.ceil(
          response.recipeCount / recipesPerPage,
        )

        setTotalNumberOfPages(totalNumberOfPages)

        const nextPageQuery = {
          collection: 'recipes',
          queries: queries,
          orderByField: orderByField,
          orderByDirection: orderByDirection,
          perPage: recipesPerPage,
          pageNumber: currentPageNumber,
          pageNumber: currentPageNumber + 1,
        }

        const nextPageResponse =
          await FirebaseFirestoreRestService.readDcoments(
            nextPageQuery,
          )

        if (
          nextPageResponse &&
          nextPageResponse.documents &&
          nextPageResponse.documents.lenght === 0
        ) {
          setIsLastPage(true)
        } else {
          setIsLastPage(false)
        }

        if (
          response.documents.lenght === 0 &&
          currentPageNumber !== 1
        ) {
          setCurrentPageNumber(currentPageNumber - 1)
        }

        fetchedRecipes = response.documents

        fetchedRecipes.forEach((recipe) => {
          const unixPublishDateTime = recipe.publishDate
          recipe.publishDate = new Date(
            unixPublishDateTime * 1000,
          )
        })
      }
    } catch (error) {
      console.error(error.message)
      throw error
    }

    return fetchedRecipes
  }

  function handleRecipesPerPageChange(event) {
    const recipesPerPage = event.target.value
    startTransition(() => setRecipes([]))
    startTransition(() => setRecipesPerPage(recipesPerPage))
  }

  function handleLoadMoreRecipesClick() {
    const lastReicpe = recipes[recipes.length - 1]
    const cursorId = lastReicpe.id
    handleFetchedRecipes(cursorId)
  }

  async function handleFetchedRecipes(cursorId = '') {
    try {
      const fetchedRecipes = await fetchRecipes(cursorId)

      setRecipes(fetchedRecipes)
    } catch (error) {
      console.error(error.message)
      throw error
    }
  }

  async function handleAddRecipe(newRecipe) {
    try {
      // const response =
      //   await FirebaseFirestoreService.createDocument(
      //     'recipes',
      //     newRecipe,
      //   )

      const response =
        await FirebaseFirestoreRestService.createDocument(
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
      // await FirebaseFirestoreService.updateDocuemnt(
      //   'recipes',
      //   recipeId,
      //   newRecipe,
      // )

      await FirebaseFirestoreRestService.updateDocument(
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
        // await FirebaseFirestoreService.deleteDocument(
        //   'recipes',
        //   recipeId,
        // )
        await FirebaseFirestoreRestService.deleteDocument(
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
                      <div className='recipe-image-box'>
                        {recipe.imageUrl && (
                          <img
                            src={recipe.imageUrl}
                            alt={recipe.name}
                            className='recipe-image'
                          />
                        )}
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
        {isLoading ||
          (recipes && recipes.length > 0 && (
            <>
              <label className='input-label'>
                Recipes Per Page
                <select
                  value={recipesPerPage}
                  onChange={handleRecipesPerPageChange}
                  className='select'
                >
                  <option value='3'>3</option>
                  <option value='6'>6</option>
                  <option value='9'>9</option>
                </select>
              </label>
              <div className='pagination'>
                {/* <button
                  className='primary-button'
                  type='button'
                  onClick={handleLoadMoreRecipesClick}
                >
                  LOAD MORE RECIPES
                </button> */}
                <div className='row'>
                  <button
                    className={
                      currentPageNumber === 1
                        ? 'primary-button hidden'
                        : 'primary-button'
                    }
                    type='button'
                    onClick={() => {
                      setCurrentPageNumber(
                        currentPageNumber - 1,
                      )
                    }}
                  >
                    Previous
                  </button>
                  <div>Page {currentPageNumber}</div>
                  <button
                    className={
                      isLastPage
                        ? 'primary-button hidden'
                        : 'primary-button'
                    }
                    type='button'
                    onClick={() =>
                      setCurrentPageNumber(
                        currentPageNumber + 1,
                      )
                    }
                  >
                    Next
                  </button>
                </div>
                <div className='row'>
                  {!categoryFilter &&
                    new Array(totalNumberOfPages)
                      .fill(0)
                      .map((value, index) => {
                        return (
                          <button
                            key={index + 1}
                            type='button'
                            className={
                              currentPageNumber ===
                              index + 1
                                ? 'selected-page primary-button page-button'
                                : 'primary-button page-button'
                            }
                            onClick={() =>
                              setCurrentPageNumber(
                                index + 1,
                              )
                            }
                          >
                            {index + 1}
                          </button>
                        )
                      })}
                </div>
              </div>
            </>
          ))}
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
