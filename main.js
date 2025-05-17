
// Inizializzazione dell'editor Quill
const quill = new Quill('#editor', {
		theme: 'snow',
		modules: {
				toolbar: [
						['bold', 'italic', 'underline', 'strike'],
						['blockquote', 'code-block'],
						[{ 'header': 1 }, { 'header': 2 }],
						[{ 'list': 'ordered'}, { 'list': 'bullet' }],
						[{ 'color': [] }, { 'background': [] }],
						[{ 'align': [] }],

				]
		},
		placeholder: 'Inserisci i dettagli del servizio...'
});

// Stato dell'applicazione
let appState = {
		clients: [],
		selectedClient: null,
		selectedService: null,
		editMode: false
};

// Variabile per tenere traccia delle modifiche non salvate
let hasUnsavedChanges = false;


// Elementi DOM
const clientList = document.getElementById('client-list');
const serviceList = document.getElementById('service-list');
const addClientBtn = document.getElementById('add-client-btn');
const addServiceBtn = document.getElementById('add-service-btn');
const serviceEditor = document.getElementById('service-editor');
const serviceTitleInput = document.getElementById('service-title');
const saveServiceBtn = document.getElementById('save-service-btn');
const cancelBtn = document.getElementById('cancel-btn');
const downloadJsonBtn = document.getElementById('download-json-btn');
const uploadJsonBtn = document.getElementById('upload-json-btn');
const fileUpload = document.getElementById('file-upload');

// Caricamento dei dati da localStorage
function loadData() {
		const savedData = localStorage.getItem('todoAppData');
		if (savedData) {
				appState = JSON.parse(savedData);
		}
		renderClients();
}

// Salvataggio dati in localStorage
function saveData() {
		localStorage.setItem('todoAppData', JSON.stringify(appState));
}

// Rendering della lista clienti
function renderClients() {
		clientList.innerHTML = '';
		
		if (appState.clients.length === 0) {
				const emptyItem = document.createElement('div');
				emptyItem.className = 'empty-state';
				emptyItem.innerHTML = '<p>Nessun cliente presente</p>';
				clientList.appendChild(emptyItem);
				return;
		}
		
		appState.clients.forEach(client => {
				const li = document.createElement('li');
				li.className = 'client-item';
				if (appState.selectedClient && appState.selectedClient.id === client.id) {
						li.classList.add('active');
				}
				
				const nameSpan = document.createElement('span');
				nameSpan.textContent = client.name;
				
				const actions = document.createElement('div');
				actions.className = 'item-actions';
				
				const editBtn = document.createElement('button');
				editBtn.className = 'edit-btn';
				editBtn.innerHTML = "<i class='bx bx-edit'></i>";
				editBtn.title = "Modifica"
				editBtn.onclick = (e) => {
						e.stopPropagation();
						const newName = prompt('Modifica nome cliente:', client.name);
						if (newName && newName.trim()) {
								client.name = newName.trim();
								saveData();
								renderClients();
								if (appState.selectedClient && appState.selectedClient.id === client.id) {
										appState.selectedClient.name = newName.trim();
								}
						}
				};
				
				const removeBtn = document.createElement('button');
				removeBtn.className = 'remove-btn';
				removeBtn.innerHTML = "<i class='bx bx-trash-alt'></i>";
				removeBtn.title = "Elimina";
				removeBtn.onclick = (e) => {
						e.stopPropagation();
						if (confirm(`Sei sicuro di voler eliminare il cliente "${client.name}" e tutti i suoi servizi?`)) {
								appState.clients = appState.clients.filter(c => c.id !== client.id);
								if (appState.selectedClient && appState.selectedClient.id === client.id) {
										appState.selectedClient = null;
										showEmptyClientState();
								}
								saveData();
								renderClients();
						}
				};
				
				actions.appendChild(editBtn);
				actions.appendChild(removeBtn);
				
				li.appendChild(nameSpan);
				li.appendChild(actions);
				
				li.addEventListener('click', () => selectClient(client));
				clientList.appendChild(li);
		});
}

// Rendering della lista servizi per il cliente selezionato
function renderServices() {
		if (!appState.selectedClient) return;
		
		serviceList.innerHTML = '';
		
		if (!appState.selectedClient.services || appState.selectedClient.services.length === 0) {
				const emptyItem = document.createElement('div');
				emptyItem.className = 'empty-state';
				emptyItem.innerHTML = '<p>Nessun servizio per questo cliente</p><p>Clicca su "+" per aggiungere un servizio</p>';
				serviceList.appendChild(emptyItem);
				return;
		}
		
		// Ordina i servizi: completati in alto, poi non completati
		const sortedServices = [...appState.selectedClient.services].sort((a, b) => {
				if (a.completed === b.completed) return 0;
				return a.completed ? 1 : -1;
		});
		
		sortedServices.forEach(service => {
				const li = document.createElement('li');
				li.className = 'service-item';
				if (service.completed) {
						li.classList.add('completed');
				}
				if (appState.selectedService && appState.selectedService.id === service.id) {
						li.classList.add('active');
				}
				
				const titleDiv = document.createElement('div');
				titleDiv.className = 'service-title';
				
				const checkbox = document.createElement('input');
				checkbox.type = 'checkbox';
				checkbox.className = 'completion-checkbox';
				checkbox.checked = service.completed || false;
				checkbox.onclick = (e) => {
						e.stopPropagation();
						service.completed = !service.completed;
						saveData();
						renderServices();
				};
				
				const titleSpan = document.createElement('span');
				titleSpan.textContent = service.title;
				
				titleDiv.appendChild(checkbox);
				titleDiv.appendChild(titleSpan);
				
				const actions = document.createElement('div');
				actions.className = 'item-actions';
				
				const editBtn = document.createElement('button');
				editBtn.className = 'edit-btn';
				editBtn.title = "Modifica";
				editBtn.innerHTML = "<i class='bx bx-edit'></i> ";
				editBtn.onclick = (e) => {
						e.stopPropagation();
						editService(service);
				};
				
				const removeBtn = document.createElement('button');
				removeBtn.className = 'remove-btn';
				removeBtn.innerHTML = "<i class='bx bx-trash-alt'></i>";
				removeBtn.onclick = (e) => {
						e.stopPropagation();
						if (confirm(`Sei sicuro di voler eliminare il servizio "${service.title}"?`)) {
								appState.selectedClient.services = appState.selectedClient.services.filter(s => s.id !== service.id);
								if (appState.selectedService && appState.selectedService.id === service.id) {
										appState.selectedService = null;
								}
								saveData();
								renderServices();
						}
				};
				
				actions.appendChild(editBtn);
				actions.appendChild(removeBtn);
				
				li.appendChild(titleDiv);
				li.appendChild(actions);
				
				li.addEventListener('click', () => viewService(service));
				serviceList.appendChild(li);
		});
}

// Seleziona un cliente
function selectClient(client) {
	showUnsavedChangesIndicator(false);

	// se ci sono modifiche non salate chiedi conferma per cambiare
	if (hasUnsavedChanges) {
		if (!confirm("Ci sono modifiche non salvate \n Procediamo comunque ? ")) {
			return;
		}
	}


	appState.selectedClient = client;

	// aggiorna il nome del cliente visualizzato
	document.getElementById("client-name-display").textContent = client.name;
	
	// Inizializza la lista servizi se non esiste
	if (!client.services) {
			client.services = [];
	}

	// Seleziona automaticamente il primo servizio, se disponibile
	if (client.services && client.services.length > 0) {
		// Ordina servizi: non completati prima, poi completati
		const sortedServices = [...client.services].sort((a, b) => {
				if (a.completed === b.completed) return 0;
				return a.completed ? 1 : -1;
		});
		
		// Seleziona il primo servizio dopo l'ordinamento
		appState.selectedService = sortedServices[0];
		
		// Popola i campi con i dati del servizio
		serviceTitleInput.value = appState.selectedService.title;
		quill.root.innerHTML = appState.selectedService.content;
		appState.editMode = true;
	} else {
		// Se non ci sono servizi, resetta la selezione e i campi
		appState.selectedService = null;
		// resettiamo contenuto editor e titolo
		serviceTitleInput.value = "";
		quill.root.innerHTML = "";
		appState.editMode = false;
	}

	addServiceBtn.classList.remove('hidden');
	
	// Aggiorna l'interfaccia
	renderClients();
	renderServices();
}

// Aggiunge un nuovo cliente
function addClient() {
		const clientName = prompt('Nome del nuovo cliente:');
		if (clientName && clientName.trim()) {
				const newClient = {
						id: Date.now().toString(),
						name: clientName.trim(),
						services: []
				};
				
				appState.clients.push(newClient);
				saveData();
				renderClients();
				selectClient(newClient);
		}
}

// Prepara la creazione di un nuovo servizio
function addService() {
		appState.selectedService = null;
		appState.editMode = false;
		
		// Resetta i campi
		serviceTitleInput.value = '';
		quill.root.innerHTML = '';
}

// Mostra il dettaglio di un servizio esistente
function viewService(service) {
		appState.selectedService = service;
		appState.editMode = true;
		
		// Popola i campi con i dati del servizio
		serviceTitleInput.value = service.title;
		quill.root.innerHTML = service.content;
	
		renderServices();
}

// Modifica un servizio esistente
function editService(service) {
		appState.selectedService = service;
		appState.editMode = true;
		
		// Popola i campi con i dati del servizio
		serviceTitleInput.value = service.title;
		quill.root.innerHTML = service.content;
}

// Salva il servizio corrente
function saveService() {
		const title = serviceTitleInput.value.trim();
		const content = quill.root.innerHTML;
		
		if (!title) {
				alert('Inserisci un titolo per il servizio');
				return;
		}
		
		if (appState.editMode && appState.selectedService) {
				// Aggiornamento di un servizio esistente
				appState.selectedService.title = title;
				appState.selectedService.content = content;
				appState.selectedService.updatedAt = new Date().toISOString();
				// Mantiene lo stato di completamento
		} else {
				// Creazione di un nuovo servizio
				const newService = {
						id: Date.now().toString(),
						title: title,
						content: content,
						completed: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString()
				};
				
				if (!appState.selectedClient.services) {
						appState.selectedClient.services = [];
				}
				
				appState.selectedClient.services.push(newService);
				appState.selectedService = newService;
		}
		
		saveData();
		renderServices();
}

// Mostra lo stato vuoto quando nessun cliente è selezionato
function showEmptyClientState() {
		addServiceBtn.classList.add('hidden');
}

// Gestione eventi
addClientBtn.addEventListener('click', addClient);
addServiceBtn.addEventListener('click', addService);
saveServiceBtn.addEventListener('click', saveService);
cancelBtn.addEventListener('click', () => {
		appState.selectedService = null;
		renderServices();
});

// Gestione download/upload JSON
downloadJsonBtn.addEventListener('click', downloadJson);
uploadJsonBtn.addEventListener('click', () => fileUpload.click());
fileUpload.addEventListener('change', uploadJson);

function downloadJson() {
		const dataStr = JSON.stringify(appState, null, 2);
		const dataBlob = new Blob([dataStr], {type: 'application/json'});
		const url = URL.createObjectURL(dataBlob);
		
		const a = document.createElement('a');
		a.href = url;
		a.download = 'todo-app-data.json';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
}

function uploadJson(event) {
		const file = event.target.files[0];
		if (!file) return;
		
		const reader = new FileReader();
		reader.onload = function(e) {
				try {
						const jsonData = JSON.parse(e.target.result);
						if (validate(jsonData)) {
								if (confirm('Caricando questo file sovrascriverai tutti i dati esistenti. Vuoi continuare?')) {
										appState = jsonData;
										saveData();
										loadData();
										alert('Dati importati con successo!');
								}
						} else {
								alert('Il file JSON non è valido per questa applicazione.');
						}
				} catch (error) {
						alert('Errore durante la lettura del file: ' + error.message);
				}
				// Reset input file
				fileUpload.value = '';
		};
		reader.readAsText(file);
}

function validate(data) {
		// Verifica che il JSON importato abbia la struttura corretta
		if (!data || typeof data !== 'object') return false;
		if (!Array.isArray(data.clients)) return false;
		
		// Verifica che ogni cliente abbia i campi necessari
		for (const client of data.clients) {
				if (!client.id || !client.name) return false;
				if (client.services && !Array.isArray(client.services)) return false;
				
				// Verifica che ogni servizio abbia i campi necessari
				if (client.services) {
						for (const service of client.services) {
								if (!service.id || !service.title || !service.content) return false;
						}
				}
		}
		
		return true;
}


// Aggiungi questo alla fine del file main.js

// Gestione del tema
function initThemeToggle() {
	const themeToggle = document.getElementById('theme-toggle');
	const themeLabel = document.getElementById('theme-label');
	
	// Verifica se esiste una preferenza nel localStorage
	const isDarkTheme = localStorage.getItem('darkTheme') === 'true';
	
	// Imposta lo stato iniziale
	if (isDarkTheme) {
			document.body.classList.add('dark-theme');
			themeToggle.checked = true;
			themeLabel.textContent = 'Tema Scuro';
	} else {
			themeLabel.textContent = 'Tema Chiaro';
	}
	
	// Gestione del cambiamento
	themeToggle.addEventListener('change', function() {
			if (this.checked) {
					document.body.classList.add('dark-theme');
					localStorage.setItem('darkTheme', 'true');
					themeLabel.textContent = 'Tema Scuro';
			} else {
					document.body.classList.remove('dark-theme');
					localStorage.setItem('darkTheme', 'false');
					themeLabel.textContent = 'Tema Chiaro';
			}
	});
}


// ---------------------------------------------------------------

// Funzione per mostrare l'indicatore di modifiche non salvate
function showUnsavedChangesIndicator(show) {
	const indicator = document.getElementById('unsaved-indicator');
	if (indicator) {
			indicator.style.display = show ? 'flex' : 'none';
			hasUnsavedChanges = show;
	}
}



// Aggiungi i listener per rilevare le modifiche
function setupChangeDetection() {
	// Listener per i cambiamenti nel titolo
	serviceTitleInput.addEventListener('input', function() {
			showUnsavedChangesIndicator(true);
	});
	
	// Listener per i cambiamenti nell'editor Quill
	quill.on('text-change', function() {
			showUnsavedChangesIndicator(true);
	});
	
	// Resetta l'indicatore quando si salva o si cancella
	saveServiceBtn.addEventListener('click', function() {
			showUnsavedChangesIndicator(false);
	});
	
	// Aggiungi un avviso prima di cambiare servizio/client o ricaricare la pagina
	window.addEventListener('beforeunload', function(event) {
			if (hasUnsavedChanges) {
					event.preventDefault();
					// Il messaggio verrà mostrato dal browser
					event.returnValue = 'Ci sono modifiche non salvate. Sei sicuro di voler abbandonare la pagina?';
					return event.returnValue;
			}
	});
}

// Modificare la funzione viewService per resettare l'indicatore quando si carica un servizio
function viewService(service) {
		
	// Resetta l'indicatore di modifiche
	showUnsavedChangesIndicator(false);
	

	appState.selectedService = service;
	appState.editMode = true;
	
	// Popola i campi con i dati del servizio
	serviceTitleInput.value = service.title;
	quill.root.innerHTML = service.content;
	renderServices();
}

// Modifica alla funzione addService per resettare l'indicatore
function addService() {
	appState.selectedService = null;
	appState.editMode = false;
	
	// Resetta i campi
	serviceTitleInput.value = '';
	quill.root.innerHTML = '';
	
	// Resetta l'indicatore di modifiche
	showUnsavedChangesIndicator(false);
}

// Inizializza il rilevamento delle modifiche
setupChangeDetection();

//---------------------------------------------------------------



// Inizializza il selettore di tema
initThemeToggle();

// Inizializzazione dell'app
loadData();

