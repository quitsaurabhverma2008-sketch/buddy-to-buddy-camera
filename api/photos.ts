import type { IncomingMessage, ServerResponse } from 'http';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, writeBatch } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

interface PhotoRecord {
  id: string;
  imageUrl: string;
  title: string;
  caption?: string;
  timestamp: number;
  dateFormatted?: string;
  favorite: boolean;
  tag?: string;
  filter?: string;
  location?: string;
}

// Initialize Firebase for serverless handler
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const config = firebaseConfig as Record<string, any>;
const db = config.firestoreDatabaseId
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

const PHOTOS_COLLECTION = 'photos';

export default async function handler(req: any, res: any) {
  // Enable CORS for all devices and origins
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      try {
        const q = query(collection(db, PHOTOS_COLLECTION), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const photos: PhotoRecord[] = [];
        snap.forEach((docSnap) => {
          photos.push(docSnap.data() as PhotoRecord);
        });
        res.status(200).json({ 
          success: true, 
          photos, 
          count: photos.length,
          revision: Date.now()
        });
        return;
      } catch (err: any) {
        // Fallback if index is warming or empty
        const snap = await getDocs(collection(db, PHOTOS_COLLECTION));
        const photos: PhotoRecord[] = [];
        snap.forEach((docSnap) => {
          photos.push(docSnap.data() as PhotoRecord);
        });
        photos.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        res.status(200).json({ 
          success: true, 
          photos, 
          count: photos.length,
          revision: Date.now()
        });
        return;
      }
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }
      }

      if (body.action === 'clear_all') {
        const snap = await getDocs(collection(db, PHOTOS_COLLECTION));
        const batch = writeBatch(db);
        snap.forEach((d) => {
          batch.delete(d.ref);
        });
        await batch.commit();
        res.status(200).json({ success: true, photos: [], isCleared: true, revision: Date.now() });
        return;
      }

      const photoToSave: PhotoRecord | null = body.photo || (body.id ? body : null);
      if (photoToSave && photoToSave.id) {
        await setDoc(doc(db, PHOTOS_COLLECTION, photoToSave.id), photoToSave, { merge: true });
        res.status(200).json({ success: true, photo: photoToSave, revision: Date.now() });
        return;
      }

      res.status(400).json({ success: false, error: 'No valid photo provided' });
      return;
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const id = url.searchParams.get('id') || req.query?.id;
      if (id) {
        await deleteDoc(doc(db, PHOTOS_COLLECTION, id));
        res.status(200).json({ success: true, deletedId: id, revision: Date.now() });
        return;
      }
      res.status(400).json({ success: false, error: 'Photo ID required' });
      return;
    }

    if (req.method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch {}
      }
      if (body.id) {
        await setDoc(doc(db, PHOTOS_COLLECTION, body.id), body, { merge: true });
        res.status(200).json({ success: true, photo: body, revision: Date.now() });
        return;
      }
      res.status(400).json({ success: false, error: 'Photo ID required' });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('API /api/photos error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
