import { useEffect, useState } from 'react'
import './App.css'
import FirebaseAuthService from './FirebaseAuthService'
import LoginForm from './components/LoginForm'
import AddEditRecipeForm from './components/AddEditRecipeForm'
import FirebaseFirestoreService from './FirebaseFirestore'

function App() {
  const [user, setUser] = useState(null)
  const [recipes, setRecipes] = useState([])

  useEffect(() => {
    fetchRecipes()
      .then((fetchedRecipes) => {
        setRecipes(fetchedRecipes)
      })
      .catch((error) => {
        console.error(error.message)
        throw error
      })
  }, [user])

  FirebaseAuthService.subscribeToAuthChanges(setUser)

  async function fetchRecipes() {
    let fetchedRecipes = []

    try {
      const response =
        await FirebaseFirestoreService.readDocuments(
          'recipes',
        )

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

  async function handleFetcheRecipes() {
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

      handleFetcheRecipes()

      alert(
        `succesfully created a recipe with an ID = ${response.id}`,
      )
    } catch (error) {
      alert(error.message)
    }
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
    return date.toLocaleDateString( undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  return (
    <div className='App'>
      <div className='title-row'>
        <h1 className='title'>Firebase Recipes</h1>
        <LoginForm existingUser={user} />
      </div>
      <div className='main'>
        <div className='center'>
          <div className='recipe-list-box'>
            {recipes && recipes.length > 0 ? (
              <div className='recipe-list'>
                {recipes.map((recipe) => {
                  return (
                    <div
                      className='recipe-card'
                      key={recipe.id}
                    >
                      {
                        recipe.isPublished === false ? (
                          <div className="unpublished">UNPUBLISHED</div>
                        ) : null
                      }
                      <div className='recipe-name'>
                        {recipe.name}
                      </div>
                      <div className='recipe-field'>
                        Category: {lookupCategoryLabel(recipe.category)}
                      </div>
                      <div className='recipe-field'>
                        Publish Date:{' '}
                        {formatDate(recipe.publishDate)}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>
        </div>
        {user && (
          <AddEditRecipeForm
            handleAddRecipe={handleAddRecipe}
          ></AddEditRecipeForm>
        )}
      </div>
    </div>
  )
}

export default App
