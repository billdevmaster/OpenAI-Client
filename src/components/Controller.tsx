import { useEffect, useState, useRef } from "react";
import Title from "./Title";
import axios from "axios";
import RecordMessage from "./RecordMessage";

const apiUrl = "https://openai-api-pgrg.onrender.com/api";

const Controller = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [text, setText] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  function createBlobURL(data: any) {
    const blob = new Blob([data], { type: "audio/mpeg" });
    const url = window.URL.createObjectURL(blob);
    return url;
  }

  const handleStop = async (blobUrl: string) => {
    console.log(blobUrl);
    setIsLoading(true);

    // Append recorded message to messages
    const myMessage = { sender: "me", blobUrl, text: "hello" };
    const messagesArr = [...messages, myMessage];
    setMessages(messagesArr);
    const macroMessage = { sender: "macro", blobUrl, text: "yes. I am me, afsdfawef, afwefasfe,fasefas faefsf ,afewfasef" };
    messagesArr.push(macroMessage);
    setMessages(messagesArr);
    return;
    // convert blob url to blob object
    fetch(blobUrl)
      .then((res) => res.blob())
      .then(async (blob) => {
        // Construct audio to send file
        const formData = new FormData();
        formData.append("file", blob, "myFile.wav");

        // send form data to api endpoint
        await axios
          .post("http://localhost:3001/api/post-audio", formData, {
            headers: {
              "Content-Type": "audio/mpeg",
            },
            responseType: "arraybuffer", // Set the response type to handle binary data
          })
          .then((res: any) => {
            const blob = res.data;
            const audio = new Audio();
            audio.src = createBlobURL(blob);

            // Append to audio
            const macroMessage = { sender: "macro", blobUrl: audio.src };
            messagesArr.push(macroMessage);
            setMessages(messagesArr);

            // Play audio
            setIsLoading(false);
            audio.play();
          })
          .catch((err: any) => {
            console.error(err);
            setIsLoading(false);
          });
      });
  };

  const sendText = async (e: any) => {
    if (e.key === 'Enter') {
      const myMessage = { sender: "me", blobUrl: null, text: text };
      const messagesArr = [...messages, myMessage];
      setMessages(messagesArr);
      setText("");
      const tempHistory = [...history];
      tempHistory.push({ role: "user", content: text })
      setHistory(tempHistory);
    }
  }

  const setMessage = (content: string, role: string) => {
    const myMessage = { sender: role, blobUrl: null, text: content };
    const messagesArr = [...messages, myMessage];
    setMessages(messagesArr);
    setText("");
    const tempHistory = [...history];
    tempHistory.push({ role, content })
    setHistory(tempHistory);
  }
  
  useEffect(() => {
    const postText = async () => {
      try {
        const res = await axios.post(apiUrl + "/postText", { history });
        console.log(res.data.content);
        setMessage(res.data.content, "assistant")
      } catch (e) {
        console.log(e)
      }
    }

    if (history.length > 0 && history[history.length - 1].role === "user") {
      postText();
    }
  }, [history]);

  useEffect(() => {
    if (messages.length) {
      ref.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages.length]);

  return (
    <div className="h-screen overflow-y-hidden">
      {/* Title */}
      <Title setMessages={setMessages} />

      <div className="flex flex-col justify-between h-full overflow-y-scroll pb-96">
        {/* Conversation */}
        <div className="mt-5 px-5">
          {messages?.map((audio, index) => {
            return (
              <div
                key={index + audio.sender}
                className={
                  "flex flex-col " +
                  (audio.sender == "assistant" && "flex items-end")
                }
              >
                {/* Sender */}
                <div className="mt-4 ">
                  <p
                    className={
                      audio.sender == "assistant"
                        ? "text-right mr-2 italic text-green-500"
                        : "ml-2 italic text-blue-500"
                    }
                  >
                    {audio.sender}
                  </p>
                  <div
                    className={
                      audio.sender == "assistant"
                        ? "my-2 ml-2 py-3 px-4 bg-gray-400 rounded-br-3xl rounded-tr-3xl rounded-tl-xl text-white inline-block min-w-[100px]"
                        : "my-2 mr-2 py-3 px-4 bg-blue-400 rounded-bl-3xl rounded-tl-3xl rounded-tr-xl text-white inline-block min-w-[100px]"
                    }
                  >
                    {audio.text}
                  </div>
                  {/* Message */}
                  {audio.blobUrl && (
                    <div>
                      <audio
                        src={audio.blobUrl}
                        className={`appearance-none ${audio.sender == "assistant" ? "float-right" : ""}`}
                        controls
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {messages.length == 0 && !isLoading && (
            <div className="text-center font-light italic mt-10">
              Send Macro a message...
            </div>
          )}

          {isLoading && (
            <div className="text-center font-light italic mt-10 animate-pulse">
              Gimme a few seconds...
            </div>
          )}
        </div>
        <div
            className="fixed bottom-0 flex flex-row items-center rounded-xl bg-white w-full px-4 bg-gradient-to-r from-sky-500 to-green-500 py-6"
          >
            <div>
              <RecordMessage handleStop={handleStop} />
            </div>
            <div className="flex-grow ml-4">
              <div className="relative w-full">
                <input
                  type="text"
                  className="flex w-full border rounded-xl focus:outline-none focus:border-indigo-300 pl-4 h-10"
                  value={text}
                  onKeyPress={sendText}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
            </div>
          </div>
        {/* Recorder */}
        {/* <div className="fixed bottom-0 w-full py-6 border-t text-center bg-gradient-to-r from-sky-500 to-green-500">
          <div className="flex items-center w-full">
            <div>
              <RecordMessage handleStop={handleStop} />
            </div>
            <div>
              <input
                className="w-full bg-gray-300 py-5 px-3 rounded-xl"
                type="text"
                placeholder="type your message here..."
              />  

            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Controller;
