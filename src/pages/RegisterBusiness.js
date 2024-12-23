// src/components/RegisterBusiness.js
import React, { useEffect, useState } from "react";
import "./RegisterBusiness.css"; // Import the custom CSS file
import { ethers } from "ethers";
import axios from "axios";
import { mnemonicToEntropy } from "ethers/lib/utils";
import { useSelector, useDispatch } from "react-redux";
import { setBusiness, setCustomer } from "../reducer";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import Abi from "./Abi";
import { Link, useNavigate } from "react-router-dom";
import Loader from "./loader";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Papa from "papaparse"; // For parsing CSV files
import * as XLSX from "xlsx"; // For parsing XLSX files

const RegisterBusiness = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dataFile,setDataFile]=useState("");
  useEffect(() => {
    // Simulate a loading delay
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);
  const [businessData, setBusinessData] = useState({
    name: "",
    email: "",
    pwd: "",
    businessWalletAddress: "",
    tokenSymbol: "",
    // Add more fields as needed
  });

  // const submitDataset=async()=>{
  //   const ipfsApiUrl = 'http://127.0.0.1:5001/api/v0/add';

  //   let data;
  //   console.log(data);
  
  //   try {
  //       // Create a FormData instance
  //       const formData = new FormData();
  
  //       // Add the JSON data as a string
  //       formData.append('file', JSON.stringify(data));
  
  //       // Send POST request to IPFS API
  //       const response = await axios.post(ipfsApiUrl, formData, {
  //           headers: formData.getHeaders(),
  //       });
  
  //       if (response.status === 200) {
  //           console.log(`JSON data stored in IPFS with CID: ${response.data.Hash}`);
  //       } else {
  //           console.error(`Failed to upload data: ${response.statusText}`);
  //       }
  //   } catch (error) {
  //       console.error(`Error uploading data to IPFS: ${error.message}`);
  //   }
  
  // }

  const submitDataset = async () => {
      // const ipfsApiUrl="/api/v0/add";
        // Create a FormData instance
        const formData = new FormData();

        // Parse the uploaded file
        let jsonData;
        if (dataFile) {
            console.log(dataFile);
            // const file = document.getElementById("dataFile").files[0];
            const file =dataFile;
            // Check file type
            if (file.name.endsWith(".csv")) {
                const text = await file.text();
                const parsedCSV = Papa.parse(text, { header: true });
                jsonData = parsedCSV.data; // Array of objects
            } else if (file.name.endsWith(".xlsx")) {
                const arrayBuffer = await file.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: "array" });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                jsonData = XLSX.utils.sheet_to_json(worksheet); // Array of objects
            } else {
                toast.error("Unsupported file format! Please upload a .csv or .xlsx file.");
                return;
            }
            console.log("Parsed JSON Data: ", jsonData);
        } else {
            toast.error("No file selected!");
            return;
        }

        const response = await axios.post(
          "http://localhost:3010/send_data",
          jsonData,
        );
        window.alert(`IPFS HASH GENERATED : ${response.data['Ipfs-Hash']}`);
      

};

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        console.log("Connected to MetaMask");
        console.log(window.ethereum);
      } catch (error) {
        alert("Connect to Metamask !!");
        connectWallet();
      }
    }
  };

  useEffect(() => {
    connectWallet();
  }, []); // means at startup !!

  // "0x1c9A0af0b1a14DaD32D93e9593740407Ac691BAe"
  const getBusinessBalance = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    // Prompt user for account connections
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const add = await signer.getAddress();
    const tokenABI = Abi.tokenABI;
    const flipkartAddress = "0x37144a383A69d528A1176Ba237a0F860dA160141";

    // idhar add token contract address by taking it from the :
    // database itself !!
    const tokenContract = new ethers.Contract(
      "0x5eA776A5665dABbE9E3e1279F09F46ebc1929A00",
      tokenABI,
      provider
    );

    const tokenBalance = await tokenContract.balanceOf(flipkartAddress);
    console.log("Flip ", tokenBalance.toString());
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    await connectWallet();
    if (window.ethereum) {
      try {
        // Request account access if needed
        await window.ethereum.enable();
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        // Prompt user for account connections
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();

        const contractAddress = "0x35F37Bd9c5679F9F810747B9Aa68643F2583b0E3"; // Replace with your smart contract address
        const contractABI = Abi.contractABI; // Replace with your smart contract ABI

        // Create a contract instance
          const contract = new ethers.Contract(contractAddress, contractABI, signer);

          // Call the uploadData method
          async function uploadPatientData(data) {
              try {
                  setIsLoading(true);
                  const transaction = await contract.uploadData(data); // Call the function
                  console.log("Transaction sent! Hash:", transaction.hash); 
                  await transaction.wait(); // Wait for the transaction to be mined
                  console.log("Data uploaded successfully!", transaction);
                  setIsLoading(false);
                  toast.success("Data File Uploaded !");
                  setDataFile("");
              } catch (error) {
                  setIsLoading(false);
                  toast.error("Data File Upload Unsuccessfull !");
                  setDataFile("");
              }
          }
          const dataToUpload = "Sample patient data"; // Replace with the actual data you want to upload
          await uploadPatientData(dataToUpload);
          submitDataset();
      } catch (error) {
        console.log(error);
      }
    } else {
      await connectWallet();
    }
  };

  const getAllBusiness = async () => {
    const response = await axios.get(
      "https://flipkartbackend-un9n.onrender.com/getListOfBusiness"
    );

    // Handle the response from the backend
    console.log(response.data); // This should contain user details and access token
  };
  const dispatch = useDispatch();

  return (
    <div>
      {isLoading === true ? (
        <Loader />
      ) : (
        <div
          className="  w-screen h-screen  flex flex-col items-center gap-4 
     "
        >
          <Navbar />
          <div className="w-[30%] drop-shadow-xl bg-white shadow-lg shadow-gray-800 rounded-lg flex flex-col gap-4">
            <h2 className="text-center bg-emerald-500 py-3 text-white text-[20px] rounded-t-lg">
              Enter the Data File 
            </h2>
            <form onSubmit={handleSubmit} className="p-12">
            <label>Upload Data File (.csv or .xlsx format)</label>
              {/* <input
                type="file"
                id="businessName"
                placeholder="Upload in .csv or .xlsx format"
                value={dataFile}
                onChange={(e) =>
                  setDataFile(()=>e.target.value)
                }
                required
              /> */}
              <input
                  type="file"
                  id="dataFile"
                  accept=".csv,.xlsx"
                  onChange={(e) => {  console.log(dataFile); return setDataFile(e.target.files[0]); } }
                  required
              />

              {/* <label htmlFor="wallet">Business Wallet Address</label>
          <input
            type="text"
            id="wallet"
            placeholder="Enter your wallet address"
            value={businessData.businessWalletAddress}
            onChange={(e) => setBusinessData({ ...businessData, businessWalletAddress: e.target.value })}
            required
          /> */}
              {/* Add more input fields for other details */}
              <div className="flex flex-col mt-6  gap-3">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="submit"
                  className="px-1 py-3 bg-emerald-500 rounded-md text-white text-[18px]  shadow-md shadow-blue-400"
                >
                  Upload
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      {/* Same as */}
      <ToastContainer />
    </div>
  );
};

export default RegisterBusiness;
