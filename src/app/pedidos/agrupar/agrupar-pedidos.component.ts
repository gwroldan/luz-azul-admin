import { Component, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material';

import * as XLSX from 'xlsx';
import swal from 'sweetalert2';
import { NgxStepperComponent, StepperOptions } from 'ngx-stepper';

type AOA = any[][];

@Component({
  selector: 'app-agrupar-pedidos',
  templateUrl: './agrupar-pedidos.component.html',
  styleUrls: ['./agrupar-pedidos.component.scss']
})
export class AgruparPedidosComponent implements OnInit {
  public inputFileModel: Array<any> = new Array<any>();
  public inputMaxFiles: number = 40;
  public inputAccept: string = '.xls,.xlsx';
  public data: AOA;
  private cabecera: AOA = [
      ['Empresa:', 'Ensemble SRL'],
      ['Fecha:', new Date()],
      [],
      ['Cod. Producto', 'Descripcion', 'Cant. Pedida', 'Cant. Real', 'Kg. Reales', 'Kg. Pedidos', 'Lote']
    ];
  private internalFileModel: Array<any> = new Array<any>(); // I need for disconetion of model when remove all files
  private fileName = 'PedidoAgrupado.xls';

  @ViewChild('stepperDemo')
  public steppers: NgxStepperComponent;
  public options: StepperOptions = {
    vertical: false,
    linear: true,
    alternative: true,
    mobileStepText: false,
    enableSvgIcon: true,
    labelStep: 'Paso',
    labelOf: 'de'
  };

  constructor(private _iconRegistry: MatIconRegistry, private _sanitizer: DomSanitizer) { }

  public ngOnInit(): void {
    this._iconRegistry
      .addSvgIcon('step-done', this._sanitizer.bypassSecurityTrustResourceUrl('assets/icon/done.svg'));
    this._iconRegistry
      .addSvgIcon('step-warning', this._sanitizer.bypassSecurityTrustResourceUrl('assets/icon/warning.svg'));
  }

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

  private exportFile() {
    swal({
      title: 'Esta Seguro?',
      text: 'Desea exportar los datos seleccionados?',
      type: 'question',
      showCancelButton: true,
      confirmButtonText: 'Exportar',
      cancelButtonText: 'Cancelar',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise((resolve) => {
          this.steppers.next();

          setTimeout(() => {
              /* generate worksheet */
              const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(this.data);

              /* generate workbook and add the worksheet */
              const wb: XLSX.WorkBook = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

              /* save to file */
              XLSX.writeFile(wb, this.fileName);
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

  public onAccept(file: any): void {
    console.log('accept');
    this.internalFileModel.push(file);
  }

  public onRemove(file: any): void {
    console.log('remove');
    this.internalFileModel.splice(this.internalFileModel.indexOf(file), 1);
  }

  public onLimit(): void {
    console.log('limit');
    swal({
      type: 'info',
      title: 'Limite',
      text: `Solo se pueden cargar hasta ${this.inputMaxFiles} archivos!`
    });
  }

  public onReject(): void {
    console.log('reject');
    swal({
      type: 'warning',
      title: 'Archivo Invalido',
      html: `Solo se pueden cargar archivos con extension <b>${this.inputAccept}</b>!`
    });
  }

  public previousStep(): void {
    this.steppers.back();
  }

  public nextStep(): void {
    if (this.internalFileModel.length > 1) {
      this.steppers.clearError();

      this.readMultipleFiles(this.internalFileModel)
        .then((detalle: AOA) => {
          this.data = [ ...this.cabecera, ...this.agruparDetalle(detalle)];
          this.steppers.next();
        })
        .catch((err) => {
          console.error('Ocurrio un error inesperado:', err);
        });
    } else {
      this.steppers.error('Debe seleccionar al menos 2 pedidos');
    }
  }
}
