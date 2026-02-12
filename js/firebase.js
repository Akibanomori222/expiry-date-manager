// firebase.js - Firebase Firestore integration

// ⚠️ IMPORTANT: Replace this with YOUR Firebase config from Step 3
// Firebase Console > Project Settings > Your apps > Firebase SDK snippet
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZ76Jkc5n1Ba8jnm7zozvHRZ7pAmb9GlQ",
  authDomain: "expiry-date-manager-e8484.firebaseapp.com",
  projectId: "expiry-date-manager-e8484",
  storageBucket: "expiry-date-manager-e8484.firebasestorage.app",
  messagingSenderId: "801616785736",
  appId: "1:801616785736:web:1f7cc7e7f376ba4fac437d"
};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Collection reference
const ingredientsCollection = db.collection('ingredients');

console.log('Firebase initialized successfully!');

/**
 * Load all ingredients from Firestore
 * @returns {Promise<Array>} Array of ingredients
 */
async function loadIngredientsFromFirestore() {
    try {
        const snapshot = await ingredientsCollection.orderBy('expirationDate', 'asc').get();
        const ingredients = [];

        snapshot.forEach(doc => {
            ingredients.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log(`Loaded ${ingredients.length} ingredients from Firestore`);
        return ingredients;
    } catch (error) {
        console.error('Error loading from Firestore:', error);
        throw error;
    }
}

/**
 * Add ingredient to Firestore
 * @param {Object} ingredient - Ingredient object
 * @returns {Promise<string>} Document ID
 */
async function addIngredientToFirestore(ingredient) {
    try {
        // Remove local ID so Firestore generates its own document ID
        const { id, ...data } = ingredient;
        const docRef = await ingredientsCollection.add(data);
        console.log('Ingredient added with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error adding to Firestore:', error);
        throw error;
    }
}

/**
 * Update ingredient in Firestore
 * @param {string} id - Ingredient ID
 * @param {Object} data - Updated data
 * @returns {Promise<boolean>} Success status
 */
async function updateIngredientInFirestore(id, data) {
    try {
        await ingredientsCollection.doc(id).update({
            ...data,
            updatedAt: new Date().toISOString()
        });
        console.log('Ingredient updated:', id);
        return true;
    } catch (error) {
        console.error('Error updating in Firestore:', error);
        throw error;
    }
}

/**
 * Delete ingredient from Firestore
 * @param {string} id - Ingredient ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteIngredientFromFirestore(id) {
    try {
        await ingredientsCollection.doc(id).delete();
        console.log('Ingredient deleted:', id);
        return true;
    } catch (error) {
        console.error('Error deleting from Firestore:', error);
        throw error;
    }
}

/**
 * Clear all ingredients from Firestore
 * @returns {Promise<boolean>} Success status
 */
async function clearAllIngredientsFromFirestore() {
    try {
        const snapshot = await ingredientsCollection.get();
        const batch = db.batch();

        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log('All ingredients cleared from Firestore');
        return true;
    } catch (error) {
        console.error('Error clearing Firestore:', error);
        throw error;
    }
}

/**
 * Listen to real-time updates from Firestore
 * @param {Function} callback - Callback function when data changes
 */
function listenToIngredientsChanges(callback) {
    ingredientsCollection.orderBy('expirationDate', 'asc').onSnapshot(
        snapshot => {
            const ingredients = [];
            snapshot.forEach(doc => {
                ingredients.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            console.log('Real-time update received:', ingredients.length, 'ingredients');
            callback(ingredients);
        },
        error => {
            console.error('Error listening to changes:', error);
        }
    );
}
