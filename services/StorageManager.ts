import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'SynapseForgeVault';
const STORE_UPLOADS = 'uploads';
const STORE_PROJECTS = 'projects';
const STORE_VISUALS = 'visual_docs';

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, 2, {
            upgrade(db, oldVersion) {
                if (oldVersion < 1) {
                    db.createObjectStore(STORE_UPLOADS);
                    db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
                }
                if (oldVersion < 2) {
                    if (!db.objectStoreNames.contains(STORE_VISUALS)) {
                        db.createObjectStore(STORE_VISUALS, { autoIncrement: true });
                    }
                }
            },
        });
    }
    return dbPromise;
};

const notifyIoProgress = (status: 'IDLE' | 'READING' | 'WRITING' | 'VERIFYING' | 'JAMMED', progress?: number) => {
    window.dispatchEvent(new CustomEvent('forge-io', { detail: { status, progress } }));
};

export const persistProjectData = async (file: File): Promise<string> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                notifyIoProgress('READING', percent);
            }
        };

        reader.onloadstart = () => {
            notifyIoProgress('READING', 0);
        };

        reader.onload = async (e) => {
            try {
                notifyIoProgress('WRITING', 50);
                sessionStorage.removeItem('current_analysis_context');
                
                const result = e.target?.result;
                if (!result) throw new Error("File read failed");

                await db.put(STORE_UPLOADS, result, file.name);
                
                // NAL HANDSHAKE SIMULATION
                notifyIoProgress('VERIFYING', 90);
                await new Promise(r => setTimeout(r, 1000));
                
                window.dispatchEvent(new CustomEvent('forge-log', { 
                    detail: `[IO_BUS]: Writing ${file.name} to IndexedDB... (100%)` 
                }));
                notifyIoProgress('IDLE');
                
                window.dispatchEvent(new CustomEvent('FILE_READY', { detail: file.name }));
                
                resolve(result as string);
            } catch (err) {
                notifyIoProgress('JAMMED');
                reject(err);
            }
        };

        reader.onerror = () => {
            notifyIoProgress('JAMMED');
            reject(new Error("File reader error"));
        };

        reader.readAsDataURL(file);
    });
};

export const clearVaultBuffer = async () => {
    const db = await getDB();
    const tx = db.transaction(STORE_UPLOADS, 'readwrite');
    await tx.objectStore(STORE_UPLOADS).clear();
    await tx.done;
    sessionStorage.clear();
    window.dispatchEvent(new CustomEvent('forge-log', { detail: '[I/O_GUARD]: File buffer cleared. Lens Selector unlocked.' }));
    notifyIoProgress('IDLE');
};

export const defrostSystem = async () => {
    await clearVaultBuffer();
    window.dispatchEvent(new CustomEvent('forge-webgl-reset'));
};
