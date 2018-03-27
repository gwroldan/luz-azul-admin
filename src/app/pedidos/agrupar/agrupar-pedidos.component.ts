import { Component } from '@angular/core';

import * as XLSX from 'xlsx';
import swal from 'sweetalert2';

type AOA = any[][];

@Component({
  selector: 'app-agrupar-pedidos',
  templateUrl: './agrupar-pedidos.component.html',
  styleUrls: ['./agrupar-pedidos.component.scss']
})
export class AgruparPedidosComponent {
  public inputFileModel: Array<any> = new Array<any>();
  public inputMaxFiles: number = 20;
  public inputAccept: string = '.xls,.xlsx';
  private cabecera: AOA = [
      ['Empresa:', 'Ensemble SRL'],
      ['Fecha:', new Date()],
      [],
      ['Cod. Producto', 'Descripcion', 'Cant. Pedida', 'Cant. Real', 'Kg. Reales', 'Kg. Pedidos', 'Lote']
    ];
  private fileName = 'PedidoAgrupado.xls';

  private readMultipleFiles = (files) => {
    let detalle: AOA;

    function readFile(file) {
      return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const bstr: string = e.target.result;
          const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});

          /* grab first sheet */
          const wsname: string = wb.SheetNames[0];
          const ws: XLSX.WorkSheet = wb.Sheets[wsname];

          /* save data */
          const tmp: AOA = <AOA>(XLSX.utils.sheet_to_json(ws, {header: 1}));
          const firstCell: string = tmp[0][0];
          let tmpData: AOA;

          if (firstCell.startsWith('Empresa')) {
            tmpData = tmp;
            tmpData.splice(0, tmpData.findIndex((row) => row[0] === 'Cod. Producto') + 1);
            tmpData.splice(tmpData.findIndex((row) => row[0] === undefined));
          }

          resolve(tmpData);
        };
        reader.onerror = (err) => {
          console.error('Fallo al leer el archivo ', file.file.name, ' Error: ', err);
          reject(err);
        };
        reader.readAsBinaryString(file.file);
      });
    }

    const promises = Array.from(files, function(file: any) {
      return readFile(file)
        .then(function(data: AOA) {
          if (detalle) {
            detalle = [...detalle, ...data];
          } else {
            detalle = data;
          }
        });
    });

    return Promise.all(promises)
      .then(function() {
        return detalle;
      })
      ;
  }

  private agruparDetalle(detalle) {
    detalle = detalle.sort();
    const detAgrupado: AOA = new Array(detalle.shift());
    let codProducto: string = detAgrupado[0][0];
    let totalKg = 0;

    detalle.forEach((det) => {
      if (det[0] === codProducto) {
        detAgrupado[detAgrupado.length - 1][2] = parseFloat(detAgrupado[detAgrupado.length - 1][2]) + parseFloat(det[2]);
        detAgrupado[detAgrupado.length - 1][5] = parseFloat(detAgrupado[detAgrupado.length - 1][5]) + parseFloat(det[5]);
      } else {
        codProducto = det[0];
        detAgrupado.push(det);
      }
    });

    detAgrupado.forEach((det) => {
      det[2] = parseFloat(det[2]);
      det[5] = parseFloat(det[5]);
      totalKg = totalKg + det[5];
    });

    detAgrupado.push([undefined, undefined, undefined, undefined, undefined, totalKg ]);

    return detAgrupado;
  }

  private exportFile(data) {
    /* generate worksheet */
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    XLSX.writeFile(wb, this.fileName);
  }

  public onAccept(file: any): void {
    console.log('accept');
  }

  public onRemove(file: any): void {
    console.log('remove');
  }

  public onLimit(file: any): void {
    console.log('limit');
    swal({
      type: 'info',
      title: 'Limite',
      text: `Solo se pueden cargar hasta ${this.inputMaxFiles} archivos!`
    });
  }

  public onReject(file: any): void {
    console.log('reject');
    swal({
      type: 'warning',
      title: 'Archivo Invalido',
      html: `Solo se pueden cargar archivos con extension <b>${this.inputAccept}</b>!`
    });
  }

  public generar(): void {
    swal({
      title: 'Esta Seguro?',
      text: 'Desea agrupar los pedidos seleccionados?',
      type: 'question',
      showCancelButton: true,
      confirmButtonText: 'Agrupar',
      cancelButtonText: 'Cancelar',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            this.readMultipleFiles(this.inputFileModel)
              .then((detalle: AOA) => {
                this.exportFile([ ...this.cabecera, ...this.agruparDetalle(detalle)]);
              })
              .catch((err) => {
                console.error('Ocurrio un error inesperado:', err);
              });
            resolve();
          }, 1000);
        });
      },
      allowOutsideClick: () => !swal.isLoading()
    }).then((result) => {
      if (result.value) {
        swal({
          title: 'Agrupado',
          text: 'Los pedidos se agruparon con exito.',
          type: 'success',
        }).then(() => {
          window.location.reload();
        });
      }
    });
  }
}
