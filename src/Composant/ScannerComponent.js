import React, { useEffect, useState } from "react";
import Dynamsoft from "dwt";
import axios from "axios";

export default function ScannerComponent() {
  const [DWObject, setDWObject] = useState(null);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    Dynamsoft.DWT.RegisterEvent("OnWebTwainReady", () => {
      let obj = Dynamsoft.DWT.GetWebTwain("dwtcontrolContainer");
      if (obj) {
        setDWObject(obj);
        setPageCount(obj.HowManyImagesInBuffer);
        console.log("Scanner prêt !");
      }
    });

    Dynamsoft.DWT.Containers = [
      { ContainerId: "dwtcontrolContainer", Width: 600, Height: 400 },
    ];
    Dynamsoft.DWT.Load();
  }, []);

  const acquireImage = () => {
    if (DWObject) {
      // Vérifier si un scanner est disponible
      if (DWObject.SourceCount === 0) {
        alert("❌ Scan non disponible. Aucun scanner détecté !");
        return;
      }

      DWObject.AcquireImage({
        IfShowUI: true,
        IfFeederEnabled: false,
        PixelType: 2, // 0: B&W, 1: Gray, 2: Color
        Resolution: 300,
      });
      setTimeout(() => setPageCount(DWObject.HowManyImagesInBuffer), 1000);
    } else {
      alert("❌ Le module de scan n’est pas prêt !");
    }
  };

  const removePage = (index) => {
    if (DWObject && index >= 0 && index < DWObject.HowManyImagesInBuffer) {
      DWObject.RemoveImage(index);
      setPageCount(DWObject.HowManyImagesInBuffer);
    }
  };

  const clearAll = () => {
    if (DWObject) {
      DWObject.RemoveAllImages();
      setPageCount(0);
    }
  };

  const saveMultiPagePDF = async () => {
    if (!DWObject || DWObject.HowManyImagesInBuffer === 0) {
      alert("Aucune image scannée !");
      return;
    }

    let indices = [];
    for (let i = 0; i < DWObject.HowManyImagesInBuffer; i++) {
      indices.push(i);
    }

    DWObject.ConvertToBlob(
      indices,
      Dynamsoft.DWT.EnumDWT_ImageType.IT_PDF,
      (result) => {
        const file = new File([result], "scan-multipage.pdf", {
          type: "application/pdf",
        });

        let formData = new FormData();
        formData.append("file", file);

        axios
          .post("http://localhost:8000/api/upload-scan", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
          .then((res) => {
            alert("✅ PDF multipage enregistré avec succès !");
            console.log(res.data);
          })
          .catch((err) => {
            console.error(err);
            alert("❌ Erreur lors de l'enregistrement !");
          });
      },
      (err) => {
        console.error("Erreur conversion PDF :", err);
      }
    );
  };

  return (
    <div className="container mt-4">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">📑 Scanner un document</h4>
        </div>
        <div className="card-body">
          {/* Zone TWAIN */}
          <div id="dwtcontrolContainer" className="border mb-3"></div>

          {/* Boutons d’action */}
          <div className="mb-3 d-flex gap-2">
            <button className="btn btn-primary" onClick={acquireImage}>
              📄 Scanner une page
            </button>
            <button className="btn btn-success" onClick={saveMultiPagePDF}>
              💾 Enregistrer PDF multipage
            </button>
            <button className="btn btn-danger" onClick={clearAll}>
              🗑️ Tout supprimer
            </button>
          </div>

          {/* Liste des pages */}
          <h5>Pages scannées : {pageCount}</h5>
          {pageCount > 0 ? (
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: pageCount }, (_, i) => (
                  <tr key={i}>
                    <td>Page {i + 1}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removePage(i)}
                      >
                        ❌ Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted">Aucune page scannée.</p>
          )}
        </div>
      </div>
    </div>
  );
}
