import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { juzAmmaData } from '../data/juzAmmaData.js';
const SurahSelectionScreen = ({ surahs, onSelectSurah, onToggleBluetooth, bluetoothStatus, connectedDeviceName, autoReconnectEnabled, onToggleAutoReconnect }) => {
    return (React.createElement('div', { className: 'container' }, React.createElement('h1', { className: 'header', "aria-live": "polite" }, 'Select a Surah from Juz Amma'), React.createElement('ul', { className: 'surah-list', role: 'listbox' }, surahs.map((surah) => (React.createElement('li', {
        key: surah.number,
        className: 'surah-list-item',
        onClick: () => onSelectSurah(surah),
        onKeyPress: (e) => { if (e.key === 'Enter' || e.key === ' ')
            onSelectSurah(surah); },
        tabIndex: 0,
        role: 'option',
        'aria-label': `Surah ${surah.englishName}`
    }, `${surah.englishName} (${surah.name})`)))), React.createElement('div', { className: 'bluetooth-controls', style: { marginTop: '20px', paddingBottom: '20px', textAlign: 'center' } }, React.createElement('button', {
        className: 'nav-button',
        onClick: onToggleBluetooth,
        'aria-label': connectedDeviceName ? `Disconnect from ${connectedDeviceName}` : 'Connect Bluetooth Remote Control',
        'aria-haspopup': !connectedDeviceName ? 'dialog' : undefined
    }, connectedDeviceName ? `Disconnect ${connectedDeviceName}` : 'Connect Bluetooth Remote'), React.createElement('p', { className: 'bluetooth-status', 'aria-live': 'polite', style: { marginTop: '10px', fontSize: '0.9em', color: '#555' } }, bluetoothStatus), React.createElement('label', {
        style: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '10px', fontSize: '0.9em' }
    }, React.createElement('input', {
        type: 'checkbox',
        checked: autoReconnectEnabled,
        onChange: (e) => onToggleAutoReconnect(e.target.checked),
        style: { marginRight: '8px' }
    }), 'Auto-reconnect when disconnected'))));
};
// Add English translation to verse display
const VerseDisplayScreen = ({ surah, verseIndex, onNext, onPrev, onBack }) => {
    const currentVerse = surah.verses[verseIndex];
    const totalVerses = surah.verses.length;
    return (React.createElement('div', { className: 'verse-display landscape-optimized' }, React.createElement('div', { className: 'verse-header-row' }, React.createElement('div', { className: 'verse-title-block' }, React.createElement('h2', { className: 'surah-title', 'aria-live': 'polite' }, `${surah.englishName} `, React.createElement('span', { className: 'surah-arabic' }, `(${surah.name})`)), React.createElement('p', { className: 'verse-info', 'aria-live': 'polite' }, `Verse ${currentVerse.numberInSurah} of ${totalVerses}`))), React.createElement('div', { className: 'verse-main-row' }, React.createElement('div', { className: 'verse-arabic-block' }, React.createElement('p', {
        className: 'verse-text',
        lang: 'ar',
        dir: 'rtl',
        'aria-label': `Verse text: ${currentVerse.text}`
    }, currentVerse.text))), React.createElement('div', { className: 'verse-translation-block' }, React.createElement('p', {
        className: 'verse-translation-text',
        lang: 'en',
        dir: 'ltr',
        'aria-label': `Verse translation: ${currentVerse.translation || ''}`
    }, `(${currentVerse.numberInSurah}) ${currentVerse.translation || ''}`)), React.createElement('div', { className: 'verse-footer-nav' }, React.createElement('button', {
        className: 'nav-button',
        onClick: onPrev,
        disabled: verseIndex === 0,
        'aria-label': 'Previous Verse'
    }, 'Previous  '), React.createElement('button', {
        className: 'back-button landscape-back',
        onClick: onBack,
        'aria-label': 'Back to Surah List'
    }, 'Back to Surah List'), React.createElement('button', {
        className: 'nav-button',
        onClick: onNext,
        disabled: verseIndex === totalVerses - 1,
        'aria-label': 'Next Verse'
    }, 'Next'))));
};
// --- Toast Component ---
const Toast = ({ message, visible }) => {
    return (React.createElement('div', {
        className: `toast-notification${visible ? ' show' : ''}`,
        role: 'status',
        'aria-live': 'polite',
        style: {
            position: 'fixed',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(60, 183, 116, 0.97)',
            color: '#fff',
            padding: '16px 32px',
            borderRadius: '8px',
            fontSize: '1.1em',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            opacity: visible ? 1 : 0,
            pointerEvents: 'none',
            transition: 'opacity 0.4s',
            zIndex: 9999,
            maxWidth: '90vw',
            textAlign: 'center',
        }
    }, message));
};
const App = () => {
    const [currentScreen, setCurrentScreen] = useState('surahList');
    const [selectedSurah, setSelectedSurah] = useState(null);
    const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
    // ===== DIFF 1: Add auto-reconnect state variables =====
    const [autoReconnectEnabled, setAutoReconnectEnabled] = useState(true);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const [lastConnectedDevice, setLastConnectedDevice] = useState(null);
    const reconnectTimeoutRef = useRef(null);
    const [connectedBluetoothDevice, setConnectedBluetoothDevice] = useState(null);
    const [controlCharacteristic, setControlCharacteristic] = useState(null);
    const [bluetoothStatus, setBluetoothStatus] = useState('Disconnected');
    // --- Add refs to avoid stale closure in onZikrButtonPress ---
    const currentScreenRef = useRef(currentScreen);
    const selectedSurahRef = useRef(selectedSurah);
    const currentVerseIndexRef = useRef(currentVerseIndex);
    useEffect(() => { currentScreenRef.current = currentScreen; }, [currentScreen]);
    useEffect(() => { selectedSurahRef.current = selectedSurah; }, [selectedSurah]);
    useEffect(() => { currentVerseIndexRef.current = currentVerseIndex; }, [currentVerseIndex]);
    // --- Add at the top of your App component ---
    const keepAliveIntervalRef = useRef(null);
    let keepAliveCharacteristic = null;
    const handleSelectSurah = (surah) => {
        setSelectedSurah(surah);
        setCurrentVerseIndex(0);
        setCurrentScreen('verseDisplay');
    };
    const handleNextVerse = () => {
        if (selectedSurah && currentVerseIndex < selectedSurah.verses.length - 1) {
            setCurrentVerseIndex(currentVerseIndex + 1);
        }
    };
    const handlePreviousVerse = () => {
        if (selectedSurah && currentVerseIndex > 0) {
            setCurrentVerseIndex(currentVerseIndex - 1);
        }
    };
    const handleBackToSurahList = () => {
        setCurrentScreen('surahList');
        setSelectedSurah(null);
    };
    // Update attemptReconnect to accept a device parameter
    const attemptReconnect = async (deviceParam) => {
        const deviceToUse = deviceParam || lastConnectedDevice;
        console.log('attemptReconnect device:', deviceToUse, autoReconnectEnabled, reconnectAttempts);
        if (!autoReconnectEnabled || !deviceToUse || reconnectAttempts >= 5) {
            if (reconnectAttempts >= 5) {
                setBluetoothStatus('Auto-reconnect failed after 5 attempts. Please reconnect manually.');
            }
            return;
        }
        const attemptNum = reconnectAttempts + 1;
        setReconnectAttempts(attemptNum);
        setBluetoothStatus(`Auto-reconnecting... (attempt ${attemptNum}/5)`);
        try {
            console.log(`Attempting reconnect to device: ${deviceToUse.name || deviceToUse.id} (attempt ${attemptNum})`);
            if (!deviceToUse.gatt) {
                throw new Error('No GATT server available');
            }
            if (!deviceToUse.gatt.connected) {
                await deviceToUse.gatt.connect();
            }
            await establishServiceConnection(deviceToUse);
            setReconnectAttempts(0);
            setBluetoothStatus(`Reconnected to ${deviceToUse.name || deviceToUse.id}`);
        }
        catch (error) {
            console.error(`Reconnect attempt ${attemptNum} failed:`, error);
            const backoffDelay = Math.min(1000 * Math.pow(2, attemptNum - 1), 30000);
            if (reconnectTimeoutRef.current)
                clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = window.setTimeout(() => {
                attemptReconnect(deviceToUse);
            }, backoffDelay);
            setBluetoothStatus(`Reconnect attempt ${attemptNum} failed. Retrying in ${Math.round(backoffDelay / 1000)}s...`);
        }
    };
    const connectBluetoothDevice = async () => {
        if (!navigator.bluetooth) {
            setBluetoothStatus('Web Bluetooth API is not available.');
            alert('Web Bluetooth API is not available in this browser. Please use a compatible browser like Chrome on Android or Desktop.');
            return;
        }
        try {
            setBluetoothStatus('Requesting device...');
            // FIXED: Use proper device filtering for Zikr Ring
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ name: 'Zikr Ring Noor' }],
                optionalServices: [
                    '0000d0ff-0000-1000-8000-00805f9b34fb', // Main service
                    '0000fff0-0000-1000-8000-00805f9b34fb' // Alternative service
                ]
            });
            if (!device.gatt) {
                setBluetoothStatus('Error: No GATT server found on device.');
                return;
            }
            // Ensure device is connected before GATT operations
            if (!device.gatt.connected) {
                setBluetoothStatus('Connecting to device...');
                await device.gatt.connect();
            }
            setBluetoothStatus(`Connected to ${device.name || device.id}. Discovering services...`);
            const server = device.gatt;
            let notifyCharacteristic = null;
            let serviceName = '';
            let service = null;
            try {
                // FIXED: Try the correct service UUID first
                setBluetoothStatus('Trying primary service d0ff...');
                service = await server.getPrimaryService('0000d0ff-0000-1000-8000-00805f9b34fb');
                // FIXED: Use the correct characteristic UUID that supports notifications
                notifyCharacteristic = await service.getCharacteristic('0000d002-0000-1000-8000-00805f9b34fb');
                serviceName = 'd0ff/d002';
            }
            catch (error) {
                try {
                    // FIXED: Try alternative service if first fails
                    setBluetoothStatus('Trying alternative service fff0...');
                    service = await server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
                    notifyCharacteristic = await service.getCharacteristic('0000fff4-0000-1000-8000-00805f9b34fb');
                    serviceName = 'fff0/fff4';
                }
                catch (error2) {
                    setBluetoothStatus('Failed to find compatible service/characteristic');
                    server.disconnect();
                    return;
                }
            }
            if (!notifyCharacteristic) {
                setBluetoothStatus('No compatible notification characteristic found.');
                server.disconnect();
                return;
            }
            setControlCharacteristic(notifyCharacteristic);
            setBluetoothStatus(`Found characteristic ${serviceName}. Starting notifications...`);
            await notifyCharacteristic.startNotifications();
            notifyCharacteristic.addEventListener('characteristicvaluechanged', handleBluetoothData);
            setConnectedBluetoothDevice(device);
            setLastConnectedDevice(device); // Store for auto-reconnect
            console.log(`Last connected device set:`, device.name || device.id);
            console.log(lastConnectedDevice);
            setBluetoothStatus(`Listening for commands from ${device.name || device.id} via ${serviceName}`);
            // --- Keep-alive logic: try to get a writable characteristic (d001 or d003) ---
            keepAliveCharacteristic = null;
            if (service) {
                try {
                    // Try d001 first
                    keepAliveCharacteristic = await service.getCharacteristic('0000d001-0000-1000-8000-00805f9b34fb');
                }
                catch (e) {
                    try {
                        // Try d003 as fallback
                        keepAliveCharacteristic = await service.getCharacteristic('0000d003-0000-1000-8000-00805f9b34fb');
                    }
                    catch (e2) {
                        // No writable characteristic found
                    }
                }
            }
            // Start keep-alive interval if we have a writable characteristic
            if (keepAliveCharacteristic) {
                if (keepAliveIntervalRef.current)
                    clearInterval(keepAliveIntervalRef.current);
                keepAliveIntervalRef.current = window.setInterval(async () => {
                    if (keepAliveCharacteristic) {
                        try {
                            await keepAliveCharacteristic.writeValue(new Uint8Array([0]));
                            // Optionally log: console.log('Keep-alive write sent');
                        }
                        catch (e) {
                            // If write fails, device may have disconnected
                        }
                    }
                }, 5000); // 5 seconds
            }
            device.addEventListener('gattserverdisconnected', () => {
                console.log(`Device ${device.name || device.id} disconnected`);
                setBluetoothStatus(`Device ${device.name || device.id} disconnected.`);
                setConnectedBluetoothDevice(null);
                setControlCharacteristic(null);
                if (notifyCharacteristic) {
                    notifyCharacteristic.removeEventListener('characteristicvaluechanged', handleBluetoothData);
                }
                // Clear keep-alive interval
                if (keepAliveIntervalRef.current) {
                    clearInterval(keepAliveIntervalRef.current);
                    keepAliveIntervalRef.current = null;
                }
                // Trigger auto-reconnect if enabled
                console.log('Attempting auto-reconnect...');
                setBluetoothStatus('Connection lost. Starting auto-reconnect...');
                attemptReconnect(device);
            });
        }
        catch (error) {
            if (error instanceof DOMException && error.name === 'NotFoundError') {
                setBluetoothStatus('No device selected. Please select your Zikr Ring Noor from the prompt.');
            }
            else {
                console.error('Bluetooth connection failed:', error);
                setBluetoothStatus(`Error: ${error.message}`);
            }
            setConnectedBluetoothDevice(null);
            setControlCharacteristic(null);
        }
    };
    // FIXED: Add proper data handler for Zikr Ring ASCII messages
    const handleBluetoothData = (event) => {
        const target = event.target;
        const value = target.value;
        if (!value)
            return;
        const data = new Uint8Array(value.buffer);
        // Convert to ASCII text (Zikr Ring sends ASCII messages)
        const asciiText = String.fromCharCode(...data);
        console.log('Raw data:', Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' '));
        console.log('ASCII:', asciiText);
        // Parse Zikr Ring protocol
        if (asciiText.startsWith('Q07,')) {
            // Button press with counter: "Q07,0002,0,0,0,0,000000000000"
            const parts = asciiText.split(',');
            if (parts.length >= 2) {
                const counter = parseInt(parts[1]);
                const now = Date.now();
                let isDoubleClick = false;
                if (counter === lastPressCounter + 1 && now - lastPressTime < DOUBLE_CLICK_THRESHOLD) {
                    isDoubleClick = true;
                }
                lastPressTime = now;
                lastPressCounter = counter;
                onZikrButtonPress(counter, isDoubleClick);
            }
        }
        else if (asciiText.startsWith('R01')) {
            // Ring acknowledgment
            console.log('Ring acknowledgment received');
        }
        else {
            console.log('Unknown message:', asciiText);
        }
    };
    // Add this function to handle button presses in your app
    const onZikrButtonPress = (counter, isDoubleClick = false) => {
        // Go to next verse if on verseDisplay screen (using refs to avoid stale closure)
        const screen = currentScreenRef.current;
        const surah = selectedSurahRef.current;
        const verseIdx = currentVerseIndexRef.current;
        if (screen === 'verseDisplay' && surah) {
            if (isDoubleClick) {
                // Go to next surah
                const currentSurahIdx = juzAmmaData.findIndex(s => s.number === surah.number);
                if (currentSurahIdx !== -1 && currentSurahIdx < juzAmmaData.length - 1) {
                    setSelectedSurah(juzAmmaData[currentSurahIdx + 1]);
                    setCurrentVerseIndex(0);
                }
            }
            else if (verseIdx < surah.verses.length - 1) {
                setCurrentVerseIndex(verseIdx + 1);
            }
        }
        // Optionally, log the counter for debugging
        console.log(`Zikr button pressed - count: ${counter}, double: ${isDoubleClick}`);
    };
    // Double click detection state
    let lastPressTime = 0;
    let lastPressCounter = 0;
    const DOUBLE_CLICK_THRESHOLD = 400; // ms
    const disconnectBluetoothDevice = async () => {
        setAutoReconnectEnabled(false);
        setReconnectAttempts(0);
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        if (!connectedBluetoothDevice || !connectedBluetoothDevice.gatt)
            return;
        setBluetoothStatus(`Disconnecting from ${connectedBluetoothDevice.name || connectedBluetoothDevice.id}...`);
        try {
            if (controlCharacteristic) {
                // Only stop notifications if the GATT server is still connected
                if (connectedBluetoothDevice.gatt.connected) {
                    await controlCharacteristic.stopNotifications();
                }
                controlCharacteristic.removeEventListener('characteristicvaluechanged', handleBluetoothData);
                setControlCharacteristic(null);
            }
            if (connectedBluetoothDevice.gatt.connected) {
                connectedBluetoothDevice.gatt.disconnect();
            }
            // Clear keep-alive interval
            if (keepAliveIntervalRef.current) {
                clearInterval(keepAliveIntervalRef.current);
                keepAliveIntervalRef.current = null;
            }
            keepAliveCharacteristic = null;
            setBluetoothStatus('Disconnected.');
        }
        catch (error) {
            console.error('Bluetooth disconnection error:', error);
            setBluetoothStatus(`Disconnection error: ${error.message}`);
        }
        finally {
            setConnectedBluetoothDevice(null);
        }
    };
    const handleToggleBluetooth = () => {
        if (connectedBluetoothDevice) {
            disconnectBluetoothDevice();
        }
        else {
            connectBluetoothDevice();
        }
    };
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (currentScreen === 'verseDisplay') {
                if (event.key === 'ArrowRight') {
                    handleNextVerse();
                }
                else if (event.key === 'ArrowLeft') {
                    handlePreviousVerse();
                }
                else if (event.key === 'Escape') {
                    handleBackToSurahList();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [currentScreen, selectedSurah, currentVerseIndex, handleNextVerse, handlePreviousVerse, handleBackToSurahList]); // Added dependencies
    // Cleanup Bluetooth connection on component unmount
    useEffect(() => {
        return () => {
            if (connectedBluetoothDevice) {
                disconnectBluetoothDevice();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connectedBluetoothDevice]); // Dependency ensures cleanup if device changes
    // Gamepad navigation support
    useEffect(() => {
        let animationFrameId;
        let pressedState = { left: false, right: false, back: false };
        const MIN_VERSE_INTERVAL_MS = 1000; // 1 second between verse changes
        const pageState = {
            lastChange: 0,
            tryChange: (cb) => {
                const now = Date.now();
                if (now - pageState.lastChange > MIN_VERSE_INTERVAL_MS) {
                    pageState.lastChange = now;
                    cb();
                }
            }
        };
        function pollGamepads() {
            let changedThisFrame = false;
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            if (gamepads) {
                for (const gp of gamepads) {
                    if (!gp)
                        continue;
                    const dpadLeft = gp.buttons[14]?.pressed;
                    const dpadRight = gp.buttons[15]?.pressed;
                    const l1 = gp.buttons[4]?.pressed;
                    const r1 = gp.buttons[5]?.pressed;
                    const backBtn = gp.buttons[8]?.pressed;
                    console.log(changedThisFrame, dpadLeft, dpadRight, l1, r1, backBtn);
                    // Only allow one page change per frame
                    if (!changedThisFrame && (dpadRight || r1) && !pressedState.right) {
                        pageState.tryChange(handleNextVerse);
                        pressedState.right = true;
                        changedThisFrame = true;
                    }
                    else if (!(dpadRight || r1)) {
                        pressedState.right = false;
                    }
                    if (!changedThisFrame && (dpadLeft || l1) && !pressedState.left) {
                        pageState.tryChange(handlePreviousVerse);
                        pressedState.left = true;
                        changedThisFrame = true;
                    }
                    else if (!(dpadLeft || l1)) {
                        pressedState.left = false;
                    }
                    if (!changedThisFrame && backBtn && !pressedState.back) {
                        pageState.tryChange(handleBackToSurahList);
                        pressedState.back = true;
                        changedThisFrame = true;
                    }
                    else if (!backBtn) {
                        pressedState.back = false;
                    }
                }
            }
            animationFrameId = requestAnimationFrame(pollGamepads);
        }
        if (currentScreen === 'verseDisplay') {
            animationFrameId = requestAnimationFrame(pollGamepads);
        }
        return () => {
            if (animationFrameId)
                cancelAnimationFrame(animationFrameId);
        };
    }, [currentScreen, selectedSurah, currentVerseIndex]);
    // ===== DIFF 3: Extract service connection logic =====
    let notifyCharacteristic = null; // hoist for disconnect event
    const establishServiceConnection = async (device) => {
        if (!device.gatt) {
            throw new Error('No GATT server found on device.');
        }
        const server = device.gatt;
        notifyCharacteristic = null;
        let serviceName = '';
        let service = null;
        try {
            setBluetoothStatus('Trying primary service d0ff...');
            service = await server.getPrimaryService('0000d0ff-0000-1000-8000-00805f9b34fb');
            notifyCharacteristic = await service.getCharacteristic('0000d002-0000-1000-8000-00805f9b34fb');
            serviceName = 'd0ff/d002';
        }
        catch (error) {
            try {
                setBluetoothStatus('Trying alternative service fff0...');
                service = await server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
                notifyCharacteristic = await service.getCharacteristic('0000fff4-0000-1000-8000-00805f9b34fb');
                serviceName = 'fff0/fff4';
            }
            catch (error2) {
                throw new Error('Failed to find compatible service/characteristic');
            }
        }
        if (!notifyCharacteristic) {
            throw new Error('No compatible notification characteristic found.');
        }
        setControlCharacteristic(notifyCharacteristic);
        setBluetoothStatus(`Found characteristic ${serviceName}. Starting notifications...`);
        await notifyCharacteristic.startNotifications();
        notifyCharacteristic.addEventListener('characteristicvaluechanged', handleBluetoothData);
        setConnectedBluetoothDevice(device);
        setLastConnectedDevice(device); // Store for auto-reconnect
        // Keep-alive logic
        keepAliveCharacteristic = null;
        if (service) {
            try {
                keepAliveCharacteristic = await service.getCharacteristic('0000d001-0000-1000-8000-00805f9b34fb');
            }
            catch (e) {
                try {
                    keepAliveCharacteristic = await service.getCharacteristic('0000d003-0000-1000-8000-00805f9b34fb');
                }
                catch (e2) {
                    // No writable characteristic found
                }
            }
        }
        if (keepAliveCharacteristic) {
            if (keepAliveIntervalRef.current)
                clearInterval(keepAliveIntervalRef.current);
            keepAliveIntervalRef.current = window.setInterval(async () => {
                if (keepAliveCharacteristic) {
                    try {
                        await keepAliveCharacteristic.writeValue(new Uint8Array([0]));
                    }
                    catch (e) {
                        // If write fails, device may have disconnected
                    }
                }
            }, 5000);
        }
    };
    const [toastMessage, setToastMessage] = useState('');
    const [toastVisible, setToastVisible] = useState(false);
    const toastTimeoutRef = useRef(null);
    // Show toast on bluetoothStatus change
    useEffect(() => {
        if (bluetoothStatus) {
            setToastMessage(bluetoothStatus);
            setToastVisible(true);
            if (toastTimeoutRef.current)
                clearTimeout(toastTimeoutRef.current);
            toastTimeoutRef.current = window.setTimeout(() => {
                setToastVisible(false);
            }, 3000);
        }
        // Cleanup on unmount
        return () => {
            if (toastTimeoutRef.current)
                clearTimeout(toastTimeoutRef.current);
        };
    }, [bluetoothStatus]);
    return (React.createElement(React.Fragment, null,
        React.createElement(Toast, { message: toastMessage, visible: toastVisible }),
        currentScreen === 'verseDisplay' && selectedSurah ? (React.createElement(VerseDisplayScreen, {
            surah: selectedSurah,
            verseIndex: currentVerseIndex,
            onNext: handleNextVerse,
            onPrev: handlePreviousVerse,
            onBack: handleBackToSurahList,
        })) : (React.createElement(SurahSelectionScreen, {
            surahs: juzAmmaData,
            onSelectSurah: handleSelectSurah,
            onToggleBluetooth: handleToggleBluetooth,
            bluetoothStatus: bluetoothStatus,
            connectedDeviceName: connectedBluetoothDevice ? (connectedBluetoothDevice.name || connectedBluetoothDevice.id) : null,
            autoReconnectEnabled: autoReconnectEnabled,
            onToggleAutoReconnect: setAutoReconnectEnabled,
        }))));
};
const rootElement = document.getElementById('root');
const reactRoot = ReactDOM.createRoot(rootElement);
reactRoot.render(React.createElement(App));
