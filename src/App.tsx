import "./App.css";
import { PurgeButton } from "./components/PurgeButton";
import { UploadZone } from "./components/Upload";

function App() {
    return (
        <>
            <h1>残高管理</h1>
            <UploadZone />
            <PurgeButton />
        </>
    );
}

export default App;
