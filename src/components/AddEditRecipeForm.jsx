import React, { useState } from 'react'

function AddEditRecipeForm({ handleAddRecipe }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [publishDate, setPublishDate] = useState(
    new Date().toISOString().split('T')[0],
  )
  const [directions, setDirections] = useState('')
  const [ingredients, setIngredients] = useState([])
  const [ingredientName, setIngredientName] = useState('')

  return (
    <form className='add-edit-recipe-form-container'>
      <h2>Add a New Recipe</h2>
      <div className='top-form-section'>
        <div className='fileds'>
          <label className='recipe-label input-label'>
            Recipe Name:
            <input
              type='text'
              className='input-text'
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className='recipe-label input-label'>
            Category:
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
          <label className='recipe-label input-label'>
            Directions:
            <textarea
              required
              value={directions}
              onChange={(e) =>
                setDirections(e.target.value)
              }
              className='input-text directions'
            ></textarea>
          </label>
          <label className='recipe-label input-label'>
            Publish Date:
            <input
              type='date'
              className='input-text'
              required
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
            />
          </label>
        </div>
      </div>
    </form>
  )
}

export default AddEditRecipeForm
