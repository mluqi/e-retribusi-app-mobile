import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import * as Print from "expo-print";
import { SvgXml } from "react-native-svg";
import Icon from "@react-native-vector-icons/material-icons";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from "../../utils/formatUtils";
import { PaymentData } from "../../types/paymentTypes";
import { useIuranContext } from "../../context/IuranContext";
import { useAuth } from "../../context/AuthContext";
import { usePasarContext } from "../../context/PasarContext";

// Ganti dengan kode SVG logo Anda.
// Anda bisa mendapatkan kode ini dari file .svg yang dibuka dengan editor teks.
const logoSvgString = `
<svg
   xmlns:dc="http://purl.org/dc/elements/1.1/"
   xmlns:cc="http://creativecommons.org/ns#"
   xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
   xmlns:svg="http://www.w3.org/2000/svg"
   xmlns="http://www.w3.org/2000/svg"
   version="1.1"
   id="svg4253"
   viewBox="0 0 160.44901 88.523744"
   height="88.523743"
   width="160.44901">
  <defs
     id="defs4255">
    <clipPath
       clipPathUnits="userSpaceOnUse"
       id="clipPath4275">
      <path
         d="m 0.567,281.112 594.708,0 0,560.777 -594.708,0 0,-560.777 z"
         id="path4277" />
    </clipPath>
    <linearGradient
       x1="0"
       y1="0"
       x2="1"
       y2="0"
       gradientUnits="userSpaceOnUse"
       gradientTransform="matrix(47.260391,1.650369,1.650369,-47.260391,449.78524,120.64061)"
       spreadMethod="pad"
       id="linearGradient4297">
      <stop
         style="stop-opacity:1;stop-color:#3aa7df"
         offset="0"
         id="stop4299" />
      <stop
         style="stop-opacity:1;stop-color:#227aab"
         offset="0.12"
         id="stop4301" />
      <stop
         style="stop-opacity:1;stop-color:#1b517e"
         offset="0.42"
         id="stop4303" />
      <stop
         style="stop-opacity:1;stop-color:#8b8666"
         offset="0.57"
         id="stop4305" />
      <stop
         style="stop-opacity:1;stop-color:#efc900"
         offset="1"
         id="stop4307" />
    </linearGradient>
    <clipPath
       clipPathUnits="userSpaceOnUse"
       id="clipPath4315">
      <path
         d="m 0,0 595.276,0 0,841.89 L 0,841.89 0,0 Z"
         id="path4317" />
    </clipPath>
    <clipPath
       clipPathUnits="userSpaceOnUse"
       id="clipPath4385">
      <path
         d="m 58.819,56.853 31.714,0 0,28.676 -31.714,0 0,-28.676 z"
         id="path4387" />
    </clipPath>
    <clipPath
       clipPathUnits="userSpaceOnUse"
       id="clipPath4405">
      <path
         d="m 173.956,56.947 24.811,0 0,28.581 -24.811,0 0,-28.581 z"
         id="path4407" />
    </clipPath>
    <clipPath
       clipPathUnits="userSpaceOnUse"
       id="clipPath4429">
      <path
         d="m 176.666,66.974 20.551,0 0,1.118 -20.551,0 0,-1.118 z"
         id="path4431" />
    </clipPath>
    <clipPath
       clipPathUnits="userSpaceOnUse"
       id="clipPath4441">
      <path
         d="m 173.956,56.947 24.811,0 0,28.581 -24.811,0 0,-28.581 z"
         id="path4443" />
    </clipPath>
    <radialGradient
       fx="0"
       fy="0"
       cx="0"
       cy="0"
       r="1"
       gradientUnits="userSpaceOnUse"
       gradientTransform="matrix(14.973784,0,0,-14.973784,114.54578,66.19774)"
       spreadMethod="pad"
       id="radialGradient4629">
      <stop
         style="stop-opacity:1;stop-color:#c51517"
         offset="0"
         id="stop4631" />
      <stop
         style="stop-opacity:1;stop-color:#75160d"
         offset="1"
         id="stop4633" />
    </radialGradient>
    <clipPath
       clipPathUnits="userSpaceOnUse"
       id="clipPath4641">
      <path
         d="m 96.061,56.693 72.368,0 0,28.836 -72.368,0 0,-28.836 z"
         id="path4643" />
    </clipPath>
    <linearGradient
       x1="0"
       y1="0"
       x2="1"
       y2="0"
       gradientUnits="userSpaceOnUse"
       gradientTransform="matrix(28.773639,6.6429082,6.6429082,-28.773639,96.217425,76.693527)"
       spreadMethod="pad"
       id="linearGradient4665">
      <stop
         style="stop-opacity:1;stop-color:#c81517"
         offset="0"
         id="stop4667" />
      <stop
         style="stop-opacity:1;stop-color:#f29270"
         offset="0.42"
         id="stop4669" />
      <stop
         style="stop-opacity:1;stop-color:#b21816"
         offset="0.76"
         id="stop4671" />
      <stop
         style="stop-opacity:1;stop-color:#f29273"
         offset="0.99"
         id="stop4673" />
      <stop
         style="stop-opacity:1;stop-color:#ffffff"
         offset="1"
         id="stop4675" />
    </linearGradient>
    <linearGradient
       x1="0"
       y1="0"
       x2="1"
       y2="0"
       gradientUnits="userSpaceOnUse"
       gradientTransform="matrix(34.099193,10.425168,10.425168,-34.099193,99.974387,72.984188)"
       spreadMethod="pad"
       id="linearGradient4691">
      <stop
         style="stop-opacity:1;stop-color:#ffffff"
         offset="0"
         id="stop4693" />
      <stop
         style="stop-opacity:1;stop-color:#d2d1d3"
         offset="0.01"
         id="stop4695" />
      <stop
         style="stop-opacity:1;stop-color:#ffffff"
         offset="0.35"
         id="stop4697" />
      <stop
         style="stop-opacity:1;stop-color:#c8c6ca"
         offset="0.64"
         id="stop4699" />
      <stop
         style="stop-opacity:1;stop-color:#ffffff"
         offset="0.95"
         id="stop4701" />
      <stop
         style="stop-opacity:1;stop-color:#ffffff"
         offset="1"
         id="stop4703" />
    </linearGradient>
    <clipPath
       clipPathUnits="userSpaceOnUse"
       id="clipPath4711">
      <path
         d="m 96.061,56.693 72.368,0 0,28.836 -72.368,0 0,-28.836 z"
         id="path4713" />
    </clipPath>
    <clipPath
       clipPathUnits="userSpaceOnUse"
       id="clipPath4315-4">
      <path
         d="m 0,0 595.276,0 0,841.89 L 0,841.89 0,0 Z"
         id="path4317-6" />
    </clipPath>
  </defs>
  <metadata
     id="metadata4258">
    <rdf:RDF>
      <cc:Work
         rdf:about="">
        <dc:format>image/svg+xml</dc:format>
        <dc:type
           rdf:resource="http://purl.org/dc/dcmitype/StillImage" />
        <dc:title></dc:title>
      </cc:Work>
    </rdf:RDF>
  </metadata>
  <g
     transform="translate(-225.98978,-964.74314)"
     id="layer1">
    <g
       transform="translate(0.49999756,-0.50000822)"
       id="g5365">
      <g
         id="g4285"
         transform="matrix(1.25,0,0,-1.25,-290.44734,1117.3019)">
        <g
           id="g4287">
          <g
             id="g4293">
            <g
               id="g4295">
              <path
                 d="m 456.457,108.54 -0.838,-4.116 c 8.281,0.033 34.339,9.609 35.549,15.322 l 0,0 c 0,-10e-4 0.08,0.374 0.158,0.751 l 0,0 c 0.078,0.375 0.155,0.75 0.15,0.75 l 0,0 c -11.289,-7.596 -28.343,-12.69 -35.019,-12.707 m -1.58,-7.101 -0.781,-3.788 c 7.984,0.015 34.339,9.607 35.549,15.321 l 0,0 0.335,1.634 c -11.674,-8.084 -28.021,-12.97 -35.103,-13.167 m -1.701,-6.912 -0.84,-4.112 c 8.034,0.156 34.341,9.606 35.551,15.318 l 0,0 0.399,1.954 c -9.049,-6.289 -27.824,-13.199 -35.11,-13.16"
                 style="fill:url(#linearGradient4297);stroke:none"
                 id="path4309" />
            </g>
          </g>
        </g>
      </g>
      <g
         id="g4311"
         transform="matrix(1.25,0,0,-1.25,-290.44734,1117.3019)">
        <g
           id="g4313"
           clip-path="url(#clipPath4315-4)">
          <g
             id="g4319"
             transform="translate(413.2877,81.84)">
            <path
               d="m 0,0 3.025,0 0,-10.568 0.07,0 c 1.078,1.876 3.024,3.094 5.737,3.094 4.173,0 7.127,-3.476 7.091,-8.589 0,-6.012 -3.788,-9.001 -7.544,-9.001 -2.434,0 -4.381,0.938 -5.632,3.162 l -0.104,0 -0.138,-2.78 -2.643,0 C -0.069,-23.534 0,-21.83 0,-20.336 L 0,0 Z m 3.025,-17.938 0,0 c 0,-0.382 0.07,-0.763 0.14,-1.112 0.591,-2.12 2.364,-3.582 4.589,-3.582 3.198,0 5.111,2.608 5.111,6.468 0,3.373 -1.74,6.257 -5.007,6.257 -2.087,0 -4.034,-1.425 -4.66,-3.755 -0.069,-0.348 -0.173,-0.764 -0.173,-1.252 l 0,-3.024 z"
               style="fill:#1b517e;fill-opacity:1;fill-rule:nonzero;stroke:none"
               id="path4321" />
          </g>
          <g
             id="g4323"
             transform="translate(444.4739,61.1911)">
            <path
               d="m 0,0 c 0,-1.461 0.069,-2.885 0.278,-4.033 l -2.782,0 -0.243,2.121 -0.105,0 c -0.938,-1.322 -2.747,-2.503 -5.144,-2.503 -3.408,0 -5.145,2.397 -5.145,4.83 0,4.069 3.614,6.295 10.116,6.257 l 0,0.35 c 0,1.389 -0.382,3.894 -3.824,3.894 -1.565,0 -3.198,-0.486 -4.381,-1.252 l -0.697,2.017 c 1.392,0.903 3.41,1.494 5.529,1.494 C -1.252,13.175 0,9.664 0,6.292 L 0,0 Z m -2.955,4.554 0,0 c -3.339,0.07 -7.127,-0.522 -7.127,-3.788 0,-1.984 1.32,-2.923 2.884,-2.923 2.191,0 3.581,1.392 4.068,2.816 0.105,0.315 0.175,0.662 0.175,0.973 l 0,2.922 z"
               style="fill:#1b517e;fill-opacity:1;fill-rule:nonzero;stroke:none"
               id="path4325" />
          </g>
          <g
             id="g4327"
             transform="translate(449.1685,69.4313)">
            <path
               d="m 0,0 c 0,1.738 -0.036,3.161 -0.139,4.553 l 2.709,0 0.176,-2.781 0.068,0 c 0.836,1.597 2.783,3.163 5.564,3.163 2.327,0 5.945,-1.391 5.945,-7.16 l 0,-10.049 -3.061,0 0,9.7 c 0,2.712 -1.006,4.973 -3.893,4.973 -2.016,0 -3.583,-1.427 -4.104,-3.131 -0.138,-0.38 -0.208,-0.903 -0.208,-1.426 l 0,-10.116 -3.057,0 L 0,0 Z"
               style="fill:#1b517e;fill-opacity:1;fill-rule:nonzero;stroke:none"
               id="path4329" />
          </g>
          <g
             id="g4331"
             transform="translate(470.9996,66.2658)">
            <path
               d="m 0,0 0.069,0 c 0.418,0.592 1.009,1.322 1.497,1.912 l 4.936,5.806 3.685,0 -6.501,-6.918 7.403,-9.908 -3.717,0 L 1.566,-1.043 0,-2.781 l 0,-6.327 -3.025,0 0,24.682 3.025,0 L 0,0 Z"
               style="fill:#1b517e;fill-opacity:1;fill-rule:nonzero;stroke:none"
               id="path4333" />
          </g>
          <g
             id="g4335"
             transform="translate(507.2961,73.3885)">
            <path
               d="m 0,0 c -0.114,0.136 -0.226,0.272 -0.347,0.397 -0.198,0.204 -0.418,0.397 -0.652,0.579 -1.266,1.034 -2.796,1.642 -4.445,1.642 -1.78,0 -3.419,-0.714 -4.738,-1.903 -0.039,-0.024 -0.072,-0.051 -0.111,-0.073 -0.047,-0.024 -0.114,-0.059 -0.192,-0.038 -0.216,0.057 -0.449,0.288 -0.45,0.619 l 0,6.881 c 0,0.431 -0.355,0.78 -0.789,0.78 l -3.348,0 c -0.437,0 -0.79,-0.349 -0.79,-0.78 l 0,-0.24 c 0,-0.008 -0.002,-0.015 -0.002,-0.025 l 0,-0.798 0.006,-22.18 c 0,-0.44 0.356,-0.798 0.795,-0.798 l 3.031,0 c 0.193,0 0.368,0.073 0.507,0.189 0.004,0.003 0.011,0.003 0.013,0.007 0.005,0.003 0.007,0.008 0.01,0.012 0.065,0.057 0.116,0.124 0.159,0.199 l 10e-4,0 c 0.052,0.098 0.087,0.201 0.099,0.315 0.06,0.49 0.394,0.761 0.601,0.69 0.071,-0.023 0.139,-0.057 0.209,-0.105 0.071,-0.044 0.14,-0.092 0.208,-0.137 0.205,-0.15 1.11,-0.769 1.809,-1.081 0.353,-0.156 1.477,-0.537 2.782,-0.537 1.306,0 2.233,0.289 2.452,0.347 0.22,0.059 0.436,0.133 0.644,0.228 1.022,0.44 1.843,1.043 2.468,1.808 0.617,0.751 1.129,1.64 1.544,2.661 0.617,1.345 0.968,2.886 0.968,4.528 C 2.442,-4.132 1.503,-1.717 0,0 m -6.913,-12.842 0,0 c -2.453,0 -4.443,2.642 -4.443,5.9 0,3.26 1.99,5.902 4.443,5.902 2.452,0 4.44,-2.642 4.44,-5.902 0,-3.258 -1.988,-5.9 -4.44,-5.9"
               style="fill:#1b517e;fill-opacity:1;fill-rule:nonzero;stroke:none"
               id="path4337" />
          </g>
          <g
             id="g4339"
             transform="translate(518.4536,74.0326)">
            <path
               d="m 0,0 c -0.003,0.045 -0.008,0.089 -0.012,0.132 l 0,0.588 c 0,0.442 -0.356,0.8 -0.798,0.8 l -3.374,0 c -0.442,0 -0.8,-0.358 -0.8,-0.8 l 0,-18.177 c -0.017,-0.463 -0.58,-1.098 -1.231,-1.255 -0.3,-0.093 -0.601,-0.136 -0.903,-0.122 -0.302,0.011 -0.509,-0.111 -0.626,-0.366 -0.046,-0.114 -0.08,-0.266 -0.105,-0.453 -0.021,-0.185 0.005,-2.133 0.018,-2.294 0.013,-0.163 0.041,-0.301 0.087,-0.416 0.139,-0.21 0.383,-0.349 0.73,-0.419 0.116,-0.047 2.356,-0.053 3.863,0.313 0.591,0.143 1.067,0.429 1.463,0.728 0.391,0.302 0.74,0.686 1.044,1.15 0.348,0.556 0.538,1.258 0.574,2.104 0.011,0.255 0.058,0.921 0.058,0.999 l 0,16.517 C -0.008,-0.882 -0.005,-0.792 0,-0.697 0.012,-0.466 0.012,-0.233 0,0"
               style="fill:#1b517e;fill-opacity:1;fill-rule:nonzero;stroke:none"
               id="path4341" />
          </g>
          <g
             id="g4343"
             transform="translate(538.2669,73.3885)">
            <path
               d="m 0,0 c -0.112,0.136 -0.225,0.272 -0.347,0.397 -0.198,0.204 -0.419,0.397 -0.652,0.579 -1.265,1.034 -2.795,1.642 -4.445,1.642 -1.779,0 -3.418,-0.714 -4.736,-1.903 -0.04,-0.024 -0.074,-0.051 -0.114,-0.073 -0.046,-0.024 -0.111,-0.059 -0.19,-0.038 -0.216,0.057 -0.449,0.288 -0.452,0.619 l 0,6.881 c 0,0.431 -0.352,0.78 -0.787,0.78 l -3.348,0 c -0.437,0 -0.79,-0.349 -0.79,-0.78 l 0,-0.24 c 0,-0.008 -0.003,-0.015 -0.003,-0.025 l 0,-0.798 0.005,-22.18 c 0,-0.44 0.357,-0.798 0.798,-0.798 l 3.027,0 c 0.196,0 0.372,0.073 0.51,0.189 0.004,0.003 0.008,0.003 0.013,0.007 0.004,0.003 0.007,0.008 0.01,0.012 0.062,0.057 0.117,0.124 0.159,0.199 l 0.002,0.003 c 0.052,0.095 0.086,0.198 0.098,0.312 0.06,0.49 0.392,0.761 0.6,0.69 0.071,-0.023 0.141,-0.057 0.21,-0.105 0.069,-0.044 0.138,-0.092 0.209,-0.137 0.204,-0.15 1.108,-0.769 1.808,-1.081 0.353,-0.156 1.475,-0.537 2.783,-0.537 1.303,0 2.23,0.289 2.451,0.347 0.22,0.059 0.435,0.133 0.644,0.228 1.019,0.44 1.844,1.043 2.469,1.808 0.617,0.751 1.129,1.64 1.543,2.661 0.616,1.345 0.967,2.886 0.967,4.528 C 2.442,-4.132 1.502,-1.717 0,0 m -6.911,-12.842 0,0 c -2.455,0 -4.443,2.642 -4.443,5.9 0,3.26 1.988,5.902 4.443,5.902 2.452,0 4.44,-2.642 4.44,-5.902 0,-3.258 -1.988,-5.9 -4.44,-5.9"
               style="fill:#1b517e;fill-opacity:1;fill-rule:nonzero;stroke:none"
               id="path4345" />
          </g>
          <g
             id="g4347"
             transform="translate(515.897,82.0734)">
            <path
               d="m 0,0 c -0.48,-0.007 -0.902,-0.116 -1.265,-0.327 -0.357,-0.218 -0.633,-0.509 -0.829,-0.866 -0.204,-0.363 -0.305,-0.763 -0.305,-1.207 0,-0.429 0.101,-0.814 0.29,-1.17 0.189,-0.357 0.458,-0.641 0.8,-0.858 0.349,-0.211 0.756,-0.32 1.222,-0.328 0.523,0.008 0.967,0.117 1.331,0.328 0.363,0.217 0.639,0.501 0.828,0.858 0.189,0.356 0.284,0.741 0.284,1.17 0,0.444 -0.102,0.844 -0.291,1.207 C 1.876,-0.836 1.6,-0.545 1.25,-0.327 0.901,-0.116 0.48,-0.007 0,0"
               style="fill:#1b517e;fill-opacity:1;fill-rule:nonzero;stroke:none"
               id="path4349" />
          </g>
        </g>
      </g>
    </g>
  </g>
</svg>
`;

const PaymentReceiptScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const receiptRef = React.useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const { fetchIurans } = useIuranContext();
  const { user } = useAuth();
  const { fetchPasarByCode } = usePasarContext();
  const [sisaIuran, setSisaIuran] = useState(0);
  const [sisaIuranPerBulan, setSisaIuranPerBulan] = useState<
    { bulan: string; jumlah: number }[]
  >([]);
  const [userPasarLogo, setUserPasarLogo] = useState<string | null>(null);

  let paymentData;
  try {
    paymentData = JSON.parse(params.paymentData as string) as PaymentData & {
      paymentDate: string;
      paymentCode: string;
    };
  } catch (error) {
    console.error("Error parsing payment data:", error);
    paymentData = {
      customerData: { CUST_NAMA: "Error Loading Data" },
      pasarName: "",
      userId: "",
      userNama: "",
      lapakData: { LAPAK_NAMA: "", LAPAK_CODE: "" },
      totalAmount: 0,
      paymentMethod: "",
      paymentDate: "",
      paymentCode: "",
      selectedIurans: [],
    };
  }

  useEffect(() => {
    const loadPasarLogo = async () => {
      if (user?.user_owner) {
        const pasarData = await fetchPasarByCode(user.user_owner);
        if (pasarData?.pasar_logo) {
          setUserPasarLogo(pasarData.pasar_logo);
        }
      }
    };
    loadPasarLogo();
  }, [user, fetchPasarByCode]);

  useEffect(() => {
    const fetchSisaIuran = async () => {
      if (!paymentData || !paymentData.customerData.CUST_CODE) return;

      try {
        const pedagangCode = paymentData.customerData.CUST_CODE;

        const fetchedIurans = await fetchIurans(
          pedagangCode,
          1,
          100,
          "",
          "pending",
          "",
          "",
          ""
        );

        const paidIuranCodes = paymentData.selectedIurans.map(
          (i) => i.IURAN_CODE
        );

        const sisaIurans = fetchedIurans.filter(
          (iuran) =>
            iuran.IURAN_PEDAGANG === paymentData.customerData.CUST_CODE &&
            iuran.IURAN_STATUS === "pending" &&
            !paidIuranCodes.includes(iuran.IURAN_CODE)
        );

        const sisa = sisaIurans.reduce(
          (total, iuran) => total + Number(iuran.IURAN_JUMLAH || 0),
          0
        );
        setSisaIuran(sisa);

        const bulanMap: { [bulan: string]: number } = {};
        sisaIurans.forEach((iuran) => {
          if (iuran.IURAN_TANGGAL) {
            const tgl = new Date(iuran.IURAN_TANGGAL);
            const bulanKey = `${tgl.getFullYear()}-${String(
              tgl.getMonth() + 1
            ).padStart(2, "0")}`;
            bulanMap[bulanKey] =
              (bulanMap[bulanKey] || 0) + Number(iuran.IURAN_JUMLAH || 0);
          }
        });

        const bulanList = Object.entries(bulanMap)
          .map(([bulan, jumlah]) => ({
            bulan,
            jumlah,
          }))
          .sort((a, b) => a.bulan.localeCompare(b.bulan)); // Sort by month

        setSisaIuranPerBulan(bulanList);
      } catch (err) {
        console.error("Error fetching sisa iurans:", err);
        setSisaIuran(0);
        setSisaIuranPerBulan([]);
      }
    };

    fetchSisaIuran();
  }, [paymentData, fetchIurans]);

  const formatBulanTahun = (bulanTahun: string) => {
    const [tahun, bulan] = bulanTahun.split("-");
    const date = new Date(parseInt(tahun), parseInt(bulan) - 1);
    return date.toLocaleString("id-ID", { month: "long", year: "numeric" });
  };

  const handleShareReceipt = async () => {
    try {
      const message = `Struk Pembayaran Iuran\n
Nama Pedagang: ${paymentData.customerData.CUST_NAMA}
Pasar: ${paymentData.pasarName}
Lapak: ${paymentData.lapakData.LAPAK_NAMA} (${paymentData.lapakData.LAPAK_CODE})
Total Pembayaran: ${formatCurrency(paymentData.totalAmount)}
Metode Bayar: ${paymentData.paymentMethod}
Tanggal: ${formatDate(paymentData.paymentDate)}
Sisa Iuran: ${formatCurrency(sisaIuran)}
Rincian Sisa Iuran: ${
        sisaIuranPerBulan.length > 0
          ? "\n" +
            sisaIuranPerBulan
              .map(
                (item) =>
                  `  - ${formatBulanTahun(item.bulan)}: ${formatCurrency(
                    item.jumlah
                  )}`
              )
              .join("\n")
          : " Lunas"
      }
User: ${paymentData.userNama}
User ID: ${paymentData.userId}
Kode Pembayaran: ${paymentData.paymentCode}`;

      await Share.share({
        message,
        title: "Struk Pembayaran Iuran",
      });
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("Error", "Gagal membagikan struk");
    }
  };

  const generateReceiptHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { 
              font-family: sans-serif; 
              padding: 5mm; 
              margin: 0;
              width: 72mm;
            }
            .header { 
              text-align: center; 
              margin-bottom: 5mm;
              padding-bottom: 2mm;
              border-bottom: 1px dashed #000;
            }
            .title { 
              font-size: 14pt; 
              font-weight: bold; 
            }
            .subtitle { 
              font-size: 10pt; 
              margin-top: 1mm;
            }
            .info-section { 
              margin-bottom: 2mm;
              font-size: 9pt;
            }
            .info-label { 
              color: #555;
              margin-bottom: 0.5mm;
            }
            .info-value { 
              font-weight: bold;
            }
            .divider { 
              height: 1px; 
              border-top: 1px dashed #aaa; 
              margin: 3mm 0; 
            }
            .payment-item { 
              display: flex;
              justify-content: space-between;
              margin-bottom: 1mm;
              font-size: 9pt;
            }
            .total-section { 
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              margin: 3mm 0;
              font-size: 11pt;
            }
            ul.info-value {
              list-style-type: none;
              padding-left: 0;
              font-weight: normal;
            }
            .rincian-item {
              display: flex;
              justify-content: space-between;
            }
            .thank-you { 
              text-align: center; 
              margin-top: 5mm;
              border-top: 1px dashed #000;
              padding-top: 3mm;
            }
            .success-text {
              font-weight: bold;
              margin-bottom: 1mm;
            }
            .logo-container {
              text-align: center;
              margin-top: 5mm;
              padding-top: 3mm;
              border-top: 1px dashed #000;
            }
            .logo-wrapper {
              display: flex;
              justify-content: center;
              align-items: center;
              margin-bottom: 2mm;
            }
            .pasar-logo {
              height: 12mm;
              width: 12mm;
              object-fit: contain;
              margin-right: 4mm;
            }
            .logo-wrapper svg {
              height: 10mm;
              width: auto;
            }
            .logo {
              max-width: 60mm;
              height: auto;
              margin: 0 auto;
            }
            .logo-text {
              font-size: 8pt;
              color: #666;
              margin-top: 2mm;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Struk Pembayaran</div>
            <div class="subtitle">#${paymentData.paymentCode}</div>
          </div>
          
          <div class="info-section">
            <div class="info-label">Nama Pedagang</div>
            <div class="info-value">${paymentData.customerData.CUST_NAMA}</div>
          </div>
          
          <div class="info-section">
            <div class="info-label">Pasar</div>
            <div class="info-value">${paymentData.pasarName}</div>
          </div>
          
          <div class="info-section">
            <div class="info-label">Lapak</div>
            <div class="info-value">
              ${paymentData.lapakData.LAPAK_NAMA} (${
      paymentData.lapakData.LAPAK_CODE
    })
            </div>
          </div>
          
          <div class="divider"></div>
          
          ${paymentData.selectedIurans
            .map(
              (item, index) => `
            <div class="payment-item">
              <div>${item.IURAN_CODE || `Iuran #${index + 1}`}</div>
              <div>${formatCurrency(item.IURAN_JUMLAH)}</div>
            </div>
          `
            )
            .join("")}
          
          <div class="divider"></div>

          <div class="total-section">
            <div class="info-label">User</div>
            <div class="info-value">${paymentData.userNama}</div>
          </div>
          
          <div class="total-section">
            <div>Total Pembayaran</div>
            <div>${formatCurrency(paymentData.totalAmount)}</div>
          </div>
          
          <div class="info-section">
            <div class="info-label">Metode Pembayaran</div>
            <div class="info-value">${paymentData.paymentMethod}</div>
          </div>
          
          <div class="info-section">
            <div class="info-label">Waktu Pembayaran</div>
            <div class="info-value">${formatDateTime(
              paymentData.paymentDate
            )}</div>
          </div>

          <div class="info-section">
            <div class="info-label">Rincian Sisa Iuran</div>
            <ul class="info-value">
              ${
                sisaIuranPerBulan.length === 0
                  ? "<li>Lunas</li>"
                  : sisaIuranPerBulan
                      .map(
                        (item) => `
                          <li class="rincian-item">
                            <span>${formatBulanTahun(item.bulan)}</span>
                            <span>${formatCurrency(item.jumlah)}</span>
                          </li>`
                      )
                      .join("")
              }
            </ul>
          </div>

          <div class="total-section">
           <div>Total Sisa Iuran</div>
           <div>${formatCurrency(sisaIuran)}</div> 
          </div>

          <div class="thank-you">
            <div class="success-text">Pembayaran Berhasil</div>
            <div>Terima kasih</div>
          </div>

          <div class="logo-container">
            <div class="logo-wrapper">
              ${
                userPasarLogo
                  ? `<img src="${userPasarLogo}" class="pasar-logo" />`
                  : ""
              }
              ${logoSvgString}</div>
            <div class="logo-text">© ${new Date().getFullYear()} E-Retribusi Pasar</div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintReceipt = async () => {
    if (isPrinting) return;

    setIsPrinting(true);

    try {
      const html = generateReceiptHTML();

      await Print.printAsync({
        html,
        width: 72, // Standard width for 72mm thermal paper (in mm)
        // Use numeric value for height instead of 'auto'
        height: 200, // Set a reasonable default height in mm, adjust as needed
        orientation: "portrait",
      });
    } catch (error) {
      console.error("Print error:", error);
      Alert.alert(
        "Kesalahan Cetak",
        "Gagal mencetak struk. Pastikan printer terhubung dengan benar."
      );
    } finally {
      setIsPrinting(false);
    }
  };

  const handleFinish = () => {
    router.replace({
      pathname: "/home",
      params: { refresh: "true" },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View ref={receiptRef} collapsable={false}>
          <View style={styles.thankYou}>
            <Icon name="check-circle" size={48} color="#4CAF50" />
            <Text style={styles.thankYouText}>Pembayaran Berhasil</Text>
            <Text style={styles.thankYouNote}>
              Terima kasih telah melakukan pembayaran
            </Text>
          </View>
          <View style={styles.header}>
            <Text style={styles.title}>Struk Pembayaran</Text>
            {/* <Text style={styles.subtitle}>#{paymentData.paymentCode}</Text> */}
          </View>

          <View style={styles.receiptCard}>
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Nama Pedagang</Text>
              <Text style={styles.infoValue}>
                {paymentData.customerData.CUST_NAMA}
              </Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Pasar</Text>
              <Text style={styles.infoValue}>{paymentData.pasarName}</Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Lapak</Text>
              <Text style={styles.infoValue}>
                {paymentData.lapakData.LAPAK_NAMA} (
                {paymentData.lapakData.LAPAK_CODE})
              </Text>
            </View>

            <View style={styles.divider} />

            {paymentData.selectedIurans.map((item, index) => (
              <View key={item.IURAN_CODE || index} style={styles.paymentItem}>
                <Text style={styles.paymentItemText}>
                  {item.IURAN_CODE || `Iuran #${index + 1}`}
                </Text>
                <Text style={styles.paymentItemAmount}>
                  {formatCurrency(item.IURAN_JUMLAH)}
                </Text>
              </View>
            ))}

            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Rincian Sisa Iuran</Text>
              <View style={{ marginTop: 4 }}>
                {sisaIuranPerBulan.length === 0 ? (
                  <Text style={styles.infoValue}>Lunas</Text>
                ) : (
                  <View>
                    {sisaIuranPerBulan.map((item, idx) => (
                      <View style={styles.rincianItem} key={idx}>
                        <Text style={styles.rincianText}>
                          {formatBulanTahun(item.bulan)}
                        </Text>
                        <Text style={styles.rincianAmount}>
                          {formatCurrency(item.jumlah)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total Sisa Iuran</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(sisaIuran)}
              </Text>
            </View>

            <View style={styles.divider} />
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>
                User : {paymentData.userNama}
              </Text>
            </View>

            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total Pembayaran</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(paymentData.totalAmount)}
              </Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Metode Pembayaran</Text>
              <Text style={styles.infoValue}>{paymentData.paymentMethod}</Text>
            </View>

            {/* <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Tanggal Pembayaran</Text>
              <Text style={styles.infoValue}>
                {formatDate(paymentData.paymentDate)}
              </Text>
            </View> */}

            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Waktu Pembayaran</Text>
              <Text style={styles.infoValue}>
                {formatDateTime(paymentData.paymentDate)}
              </Text>
            </View>

            <View style={styles.logoContainer}>
              <View style={styles.logoRow}>
                {userPasarLogo && (
                  <Image
                    source={{ uri: userPasarLogo }}
                    style={styles.pasarLogo}
                    resizeMode="contain"
                  />
                )}
                <SvgXml xml={logoSvgString} width={73} height={40} />
              </View>

              <Text style={styles.copyrightText}>
                © {new Date().getFullYear()} E-Retribusi Pasar
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleShareReceipt}
        >
          <Icon name="share" size={20} color="#4CAF50" />
          <Text style={[styles.actionButtonText, styles.shareButtonText]}>
            Bagikan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.printButton,
            isPrinting && styles.disabledButton,
          ]}
          onPress={handlePrintReceipt}
          disabled={isPrinting}
        >
          {isPrinting ? (
            <>
              <ActivityIndicator size="small" color="#2196F3" />
              <Text style={[styles.actionButtonText, styles.printButtonText]}>
                Mencetak...
              </Text>
            </>
          ) : (
            <>
              <Icon name="print" size={20} color="#2196F3" />
              <Text style={[styles.actionButtonText, styles.printButtonText]}>
                Cetak
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.finishButton]}
          onPress={handleFinish}
        >
          <Text style={[styles.actionButtonText, styles.finishButtonText]}>
            Selesai
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  receiptCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    marginBottom: 24,
  },
  infoSection: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#777",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 16,
  },
  paymentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  paymentItemText: {
    fontSize: 15,
    color: "#555",
  },
  paymentItemAmount: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  thankYou: {
    alignItems: "center",
    padding: 20,
  },
  thankYouText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4CAF50",
    marginTop: 12,
  },
  thankYouNote: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  logoContainer: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    marginHorizontal: 20,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  pasarLogo: {
    width: 50,
    height: 50,
    marginRight: 16,
  },
  copyrightText: {
    fontSize: 12,
    color: "#888",
    marginTop: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    elevation: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  shareButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#4CAF50",
    marginRight: 8,
  },
  printButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2196F3",
    marginRight: 8,
  },
  finishButton: {
    backgroundColor: "#4CAF50",
  },
  disabledButton: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  shareButtonText: {
    color: "#4CAF50",
  },
  printButtonText: {
    color: "#2196F3",
  },
  finishButtonText: {
    color: "#fff",
  },
  rincianItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  rincianText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  rincianAmount: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
});

export default PaymentReceiptScreen;
