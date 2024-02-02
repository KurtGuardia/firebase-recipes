import { useState } from 'react';
import './App.css';
import FirebaseAuthService from './FirebaseAuthService';
import LoginForm from './components/LoginForm';
import AddEditRecipeForm from './components/AddEditRecipeForm';
import FirebaseFirestoreService from './FirebaseFirestore';

function App() {
  const [user, setUser] = useState(null)

  FirebaseAuthService.subscribeToAuthChanges(setUser)

  async function handleAddRecipe(newRecipe){
    try {
      const response =  await FirebaseFirestoreService.createDocument("recipes",newRecipe)

      //TODO: fetch new recipes from firestore

      alert( `succesfully created a recipe with an ID = ${response.id}`)
    } catch (error) {
      alert(error.message)
    }
  }

  return (
    <div className="App">
     <div className="title-row">
      <h1 className="title">Firebase Recipes</h1>
      <LoginForm existingUser={user} />
     </div>
     <div className="main">
      <AddEditRecipeForm handleAddRecipe={handleAddRecipe}></AddEditRecipeForm>
      </div>
    </div>
  );
}

export default App;
