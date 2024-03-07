/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const FirebaseConfig = require('./FirebaseConfig')
const functions = FirebaseConfig.functions
const firestore = FirebaseConfig.firestore
const storageBucket = FirebaseConfig.storageBucket
const admin = FirebaseConfig.admin

exports.onCreateRecipe = functions.firestore
  .document('recipes/{recipeId}')
  .onCreate(async (snapshot) => {
    const countDocRef = firestore
      .collection('recipeCounts')
      .doc('all')
    const countDoc = await countDocRef.get()

    if (countDoc.exists) {
      countDocRef.update({
        count: admin.firestore.FieldValue.increment(1),
      })
    } else {
      countDocRef.set({ count: 1 })
    }

    const recipe = snapshot.data()

    if (recipe.isPublished) {
      const countPublishedDocRef = firestore
        .collection('recipeCounts')
        .doc('published')
      const countPublishedDoc =
        await countPublishedDocRef.get()
      if (countPublishedDoc.exists) {
        countPublishedDocRef.update({
          count: admin.firestore.FieldValue.increment(1),
        })
      } else {
        countPublishedDocRef.set({ count: 1 })
      }
    }
  })

exports.onDeleteRecipe = functions.firestore
  .document('recipes/{recipeId}')
  .onDelete(async (snapshot) => {
    const recipe = snapshot.data()
    const imageUrl = recipe.imageUrl

    if (imageUrl) {
      const decodedUrl = decodeURIComponent(imageUrl)
      const startIndex = decodedUrl.indexOf('/o/') + 3
      const endIndex = decodedUrl.indexOf('?')
      const fullFilePath = decodedUrl.substring(
        startIndex,
        endIndex,
      )
      const file = storageBucket.file(fullFilePath)

      console.log(`Attempting to delete: ${fullFilePath}`)

      try {
        file.delete()
        console.log('Successfully deleted image.')
      } catch (error) {
        console.log(
          `Failed to delete file: ${error.message}`,
        )
      }

      const countDocRef = firestore
        .collection('recipeCounts')
        .doc('all')
      const countDoc = await countDocRef.get()

      if (countDoc.exists) {
        countDocRef.update({
          count: admin.firestore.FieldValue.increment(-1),
        })
      } else {
        countDocRef.set({ count: 0 })
      }

      const recipe = snapshot.data()

      if (recipe.isPublished) {
        const countPublishedDocRef = firestore
          .collection('recipeCounts')
          .doc('published')
        const countPublishedDoc =
          await countPublishedDocRef.get()
        if (countPublishedDoc.exists) {
          countPublishedDocRef.update({
            count: admin.firestore.FieldValue.increment(-1),
          })
        } else {
          countPublishedDocRef.set({ count: 0 })
        }
      }
    }
  })

exports.onUpdateRecipe = functions.firestore
  .document('recipes/{recipeId}')
  .onUpdate(async (changes) => {
    const oldRecipe = changes.before.data()
    const newRecipe = changes.after.data()

    let publishCount = 0

    if (!oldRecipe.isPublished && newRecipe.isPublished) {
      publishCount += 1
    } else if (
      oldRecipe.isPublished &&
      !newRecipe.isPublished
    ) {
      publishCount -= 1
    }

    const publishedCountDocRef = firestore
      .collection('recipeCounts')
      .doc('published')

    const publishedCountDoc =
      await publishedCountDocRef.get()

    if (publishedCountDoc.exists) {
      publishedCountDocRef.update({
        count:
          admin.firestore.FieldValue.increment(
            publishCount,
          ),
      })
    } else {
      if (publishCount > 0) {
        publishedCountDocRef.set({ count: publishCount })
      } else {
        publishedCountDocRef.set({ count: 0 })
      }
    }
  })
