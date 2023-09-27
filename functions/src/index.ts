import * as functions from "firebase-functions";
import {Request, Response} from "express";
import {logger} from "firebase-functions";

import express = require("express");
import cors = require("cors");

const app = express();
import bodyParser = require("body-parser");
import {load} from "cheerio";
import axios from "axios";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

initializeApp();

// Parse Query String
app.use(bodyParser.urlencoded({extended: false}));

// Parse posted JSON body
app.use(bodyParser.json());

// Automatically allow cross-origin requests
app.use(cors({origin: true}));

// build multiple CRUD interfaces:
app.get("/", (req: Request, res: Response) => res.send("Api SICM"));


app.get("/import", function(req: Request, res: Response) {
  (async () => {
    const start = Number(req.query.start);
    const next = Number(req.query.next);
    const result: SicmData[] = [];
    for (let i = 0; i <= next; i++) {
      const data = await getData(start, i);
      await saveData(data);
      result.push(data);
    }
    res.send({
      success: true,
      message: "Data",
      data: result,
    });
  })();
});

async function saveData(data: SicmData) {
  try {
    const db = getFirestore();
    const docRef = db.collection("guides").doc(data.id.toString());
    await docRef.set(data);
    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
}

async function getData(min: number, i: number): Promise<SicmData> {
  const guid = min + i;
  try {
    const url = "http://www.sicm.gob.ve/g_4cguia.php?id_guia="+ guid;
    const response = await axios.get(url);
    const body = response.data;
    const $ = load(body);
    const status = $(
        "body > table > tbody > tr:nth-child(3) > td >"+
        "table > tbody > tr:nth-child(2) > td:nth-child(1)"
    ).text();
    const createdAt = $(
        "body > table > tbody > tr:nth-child(3) > td >"+
        "table > tbody > tr:nth-child(3) > td"
    ).text();
    const expirationDate = $(
        "body > table > tbody > tr:nth-child(3) > td >"+
        "table > tbody > tr:nth-child(4) > td"
    ).text();
    const documents = $(
        "body > table > tbody > tr:nth-child(3) > td >"+
        "table > tbody > tr:nth-child(5) > td"
    ).text();
    return {
      id: guid,
      status: status.split("(")[1].split(")")[0].trim(),
      createdAt: createdAt.split(":")[1].split(" ")[1].trim(),
      expirationDate: expirationDate.split(":")[1].trim(),
      documents: documents,
    };
  } catch (error) {
    logger.error(error);
    return {
      id: guid,
    };
  }
}

export const api = functions.https.onRequest(app);

export interface SicmData {
  id: number;
  status?: string | null;
  createdAt?: string | null;
  expirationDate?: string | null;
  documents?: string | null;
}
