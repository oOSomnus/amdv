use serde_json::json;
use std::sync::mpsc::{channel, Sender};
use std::sync::Mutex;
use tauri::{Emitter, WindowEvent};

static DECISION_SENDER: Mutex<Option<Sender<(bool, String)>>> = Mutex::new(None);

pub(crate) fn submit_decision(accepted: bool, note: String) -> Result<(), String> {
    let sender = DECISION_SENDER.lock().unwrap();
    let tx = sender.as_ref().ok_or("Interactive mode not initialized")?;
    tx.send((accepted, note)).map_err(|error| error.to_string())
}

pub(crate) fn initialize_interactive_mode() {
    let (tx, rx) = channel::<(bool, String)>();
    {
        let mut global_sender = DECISION_SENDER.lock().unwrap();
        *global_sender = Some(tx);
    }

    std::thread::spawn(move || {
        let (accepted, note) = rx.recv().expect("channel should not disconnect");
        let result = json!({
            "accepted": accepted,
            "note": note
        });
        println!("{result}");
        std::process::exit(0);
    });
}

pub(crate) fn setup_interactive_close_handler(window: &tauri::WebviewWindow) {
    let window_clone = window.clone();
    window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            window_clone.emit("request-close-confirm", ()).ok();
        }
    });
}
