import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

export const firebaseConfig = {
    apiKey: "AIzaSyDQnA1-Qed1K_n3KS03rQuTtcHMi21ht2E",
    authDomain: "wowfy-dde3b.firebaseapp.com",
    projectId: "wowfy-dde3b",
    storageBucket: "wowfy-dde3b.appspot.com",
    messagingSenderId: "863118669104",
    appId: "1:863118669104:web:18d3efae6c2a3e4563c4f5",
    measurementId: "G-DKMP048NXW"
  };
  

if (!firebase.apps?.length){
    firebase.initializeApp(firebaseConfig)
}